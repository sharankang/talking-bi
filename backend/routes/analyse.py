import json
import os
import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.ai_client import ask_ai
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

SCHEMA_CONTEXT = """
Database: Brazilian e-commerce (Olist dataset)
Tables:
- customers(customer_id, customer_unique_id, customer_city, customer_state)
- orders(order_id, customer_id, order_status, order_purchase_timestamp)
- order_items(order_id, order_item_id, product_id, seller_id, price, freight_value)
- products(product_id, product_category_name)
- category_translation(product_category_name, product_category_name_english)

Key joins:
- orders.customer_id = customers.customer_id
- order_items.order_id = orders.order_id
- order_items.product_id = products.product_id
- products.product_category_name = category_translation.product_category_name

Key metrics: order_items.price (revenue), order_items.freight_value, COUNT(orders.order_id)
Key dimensions: customers.customer_state, category_translation.product_category_name_english,
  TO_CHAR(orders.order_purchase_timestamp::timestamp, 'YYYY-MM') for monthly trends,
  orders.order_status
"""


def run_sql(sql: str) -> list:
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute(sql)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        cur.close()
        conn.close()
        result = []
        for row in rows:
            record = {}
            for i, col in enumerate(cols):
                val = row[i]
                if hasattr(val, '__float__'):
                    record[col] = round(float(val), 2)
                else:
                    record[col] = str(val) if val is not None else None
            result.append(record)
        return result
    except Exception as e:
        print(f"SQL error: {e}\nSQL: {sql}")
        return []


class AnalyseRequest(BaseModel):
    query: str


@router.post("/analyse")
def analyse(req: AnalyseRequest):
    # Step 1 — ask Gemini to generate a full analysis plan
    plan_prompt = f"""
You are a BI analyst. A user asked: "{req.query}"

Database schema:
{SCHEMA_CONTEXT}

Generate a comprehensive analysis plan. Always respond in English.

Return only valid JSON, no markdown backticks:
{{
  "summary": "One sentence describing the analysis",
  "kpi_cards": [
    {{
      "label": "Total Revenue",
      "sql": "SELECT ROUND(SUM(price)::numeric, 2) as value FROM order_items",
      "format": "currency"
    }},
    {{
      "label": "Total Orders",
      "sql": "SELECT COUNT(DISTINCT order_id) as value FROM orders",
      "format": "number"
    }},
    {{
      "label": "Avg Order Value",
      "sql": "SELECT ROUND((SUM(oi.price) / COUNT(DISTINCT o.order_id))::numeric, 2) as value FROM order_items oi JOIN orders o ON oi.order_id = o.order_id",
      "format": "currency"
    }},
    {{
      "label": "Total Customers",
      "sql": "SELECT COUNT(DISTINCT customer_id) as value FROM customers",
      "format": "number"
    }}
  ],
  "tabs": [
    {{
      "name": "Tab name e.g. Overview",
      "charts": [
        {{
          "title": "Chart title",
          "chart_type": "bar | line | pie",
          "sql": "SELECT ... as label, ... as value FROM ... GROUP BY ... ORDER BY value DESC LIMIT 15",
          "color": "#6366f1",
          "insight": "One sentence insight about what this chart shows"
        }}
      ]
    }}
  ]
}}

Rules:
- Always respond in English
- Generate 4 KPI cards relevant to the user's query
- Generate 3-4 tabs with 2-3 charts each covering different angles
- Every SQL must be valid PostgreSQL
- For time trends use TO_CHAR(orders.order_purchase_timestamp::timestamp, 'YYYY-MM') as label
- For category names always join with category_translation and use product_category_name_english
- Chart data columns must be named exactly 'label' and 'value'
- Tabs should cover: overview/trends, category breakdown, geographic analysis, deep dive
"""

    plan_response = ask_ai(plan_prompt)

    try:
        cleaned = plan_response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        plan = json.loads(cleaned.strip())
    except Exception:
        raise HTTPException(500, f"Could not parse analysis plan: {plan_response}")

    sql_log = []

    # Step 2 — execute KPI card SQLs
    kpi_cards = []
    for card in plan.get("kpi_cards", []):
        sql = card.get("sql", "")
        data = run_sql(sql)
        value = data[0].get("value", 0) if data else 0
        sql_log.append({"label": card["label"], "sql": sql})
        kpi_cards.append({
            "label": card["label"],
            "value": value,
            "format": card.get("format", "number")
        })

    # Step 3 — execute chart SQLs
    tabs = []
    for tab in plan.get("tabs", []):
        charts = []
        for chart in tab.get("charts", []):
            sql = chart.get("sql", "")
            data = run_sql(sql)
            sql_log.append({"label": chart["title"], "sql": sql})
            if data:
                charts.append({
                    "title": chart["title"],
                    "chart_type": chart.get("chart_type", "bar"),
                    "color": chart.get("color", "#6366f1"),
                    "insight": chart.get("insight", ""),
                    "data": data
                })
        if charts:
            tabs.append({
                "name": tab["name"],
                "charts": charts
            })

    return {
        "status": "success",
        "summary": plan.get("summary", ""),
        "kpi_cards": kpi_cards,
        "tabs": tabs,
        "sql_used": sql_log
    }