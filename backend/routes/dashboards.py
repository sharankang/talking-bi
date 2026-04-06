import json
import os
import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.ai_client import ask_ai
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()


class KPI(BaseModel):
    name: str
    aggregation: str
    metric_column: str
    group_by_column: Optional[str] = None
    chart_type: str
    requires_join: bool = False
    join_hint: Optional[str] = None


class DashboardRequest(BaseModel):
    kpis: List[KPI]
    time_filter: Optional[str] = None
    status_filter: Optional[str] = None


def run_kpi_query(kpi: KPI, time_filter: str, status_filter: str) -> list:
    metric = kpi.metric_column
    group = kpi.group_by_column

    if kpi.aggregation == "count":
        select = "COUNT(*) as value"
    else:
        select = f"{kpi.aggregation.upper()}({metric}) as value"

    # figure out which tables are needed from column prefixes
    tables_needed = set()
    for col in [metric, group]:
        if col and "." in col:
            if col.upper().startswith("TO_CHAR("):
                inner = col[8:]
                table = inner.split(".")[0]
                tables_needed.add(table)
            else:
                tables_needed.add(col.split(".")[0])

    print(f"Tables needed for {kpi.name}: {tables_needed}")

    # predefined join paths for known table combinations
    join_map = {
        frozenset(["order_items", "products"]):
            "order_items JOIN products ON order_items.product_id = products.product_id",
        frozenset(["order_items", "orders"]):
            "order_items JOIN orders ON order_items.order_id = orders.order_id",
        frozenset(["orders", "customers"]):
            "orders JOIN customers ON orders.customer_id = customers.customer_id",
        frozenset(["order_items", "category_translation"]):
            "order_items JOIN products ON order_items.product_id = products.product_id JOIN category_translation ON products.product_category_name = category_translation.product_category_name",
        frozenset(["products", "category_translation"]):
            "products JOIN category_translation ON products.product_category_name = category_translation.product_category_name",
        frozenset(["order_items", "products", "category_translation"]):
            "order_items JOIN products ON order_items.product_id = products.product_id JOIN category_translation ON products.product_category_name = category_translation.product_category_name",
        frozenset(["order_items", "orders", "customers"]):
            "order_items JOIN orders ON order_items.order_id = orders.order_id JOIN customers ON orders.customer_id = customers.customer_id",
        frozenset(["order_items", "products", "orders"]):
            "order_items JOIN products ON order_items.product_id = products.product_id JOIN orders ON order_items.order_id = orders.order_id",
        frozenset(["order_items", "products", "orders", "category_translation"]):
            "order_items JOIN products ON order_items.product_id = products.product_id JOIN category_translation ON products.product_category_name = category_translation.product_category_name JOIN orders ON order_items.order_id = orders.order_id",
    }

    # build the sql
    if group and group.upper().startswith("TO_CHAR("):
        from_clause = "orders"
        sql = f"SELECT {group} as label, {select} FROM {from_clause}"
    elif not group:
        from_clause = list(tables_needed)[0] if tables_needed else "order_items"
        sql = f"SELECT 'Total' as label, {select} FROM {from_clause}"
    else:
        if len(tables_needed) <= 1:
            from_clause = list(tables_needed)[0] if tables_needed else "order_items"
        else:
            from_clause = join_map.get(frozenset(tables_needed))
            if not from_clause:
                print(f"No join map found for: {tables_needed}, using join_hint or fallback")
                from_clause = kpi.join_hint or list(tables_needed)[0]
        sql = f"SELECT {group} as label, {select} FROM {from_clause}"

    # filters
    conditions = []
    if time_filter:
        if "orders" in sql:
            conditions.append(
                f"EXTRACT(YEAR FROM orders.order_purchase_timestamp::timestamp) = {time_filter}"
            )
    if status_filter:
        if "orders" in sql:
            conditions.append(f"orders.order_status = '{status_filter}'")

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    if group:
        if "TO_CHAR" in group or "timestamp" in group.lower():
            sql += f" GROUP BY {group} ORDER BY {group} ASC LIMIT 24"
        else:
            sql += f" GROUP BY {group} ORDER BY value DESC LIMIT 15"

    print(f"Running SQL for {kpi.name}: {sql}")

    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        result = [
            {"label": str(r[0]), "value": round(float(r[1]), 2)}
            for r in rows if r[0] is not None
        ]
        print(f"Got {len(result)} rows for {kpi.name}")
        return result
    except Exception as e:
        print(f"Query failed for {kpi.name}: {e}\nSQL: {sql}")
        return []


@router.post("/generate-dashboards")
def generate_dashboards(req: DashboardRequest):
    kpi_data = []
    for kpi in req.kpis:
        data = run_kpi_query(kpi, req.time_filter, req.status_filter)
        kpi_data.append({
            "kpi": kpi.dict(),
            "data": data
        })

    prompt = f"""
You are a BI dashboard designer for a Brazilian e-commerce company. 
Always respond in English regardless of the data's origin language.
Based on the following KPIs and their real data, design 3 different dashboard layouts.

KPI data:
{json.dumps(kpi_data, indent=2)}

CRITICAL RULES:
- Every dashboard MUST include ALL KPIs that have non-empty data — do not drop any
- You MUST use the exact data values provided — never invent numbers
- Each dashboard must have a different title, description, and chart ordering
- insight must be a real observation from the actual data shown
- If a KPI has data, it MUST appear as a chart in every dashboard

Return only valid JSON, no markdown backticks:
{{
  "dashboards": [
    {{
      "id": 1,
      "title": "Dashboard title",
      "description": "One sentence describing this layout's analytical focus",
      "kpi_coverage": 100,
      "charts": [
        {{
          "kpi_name": "Name matching input KPI",
          "chart_type": "bar | line | pie",
          "title": "Chart title",
          "data": [{{"label": "x", "value": 123}}],
          "color": "#6366f1",
          "insight": "One sentence insight from this chart's data"
        }}
      ]
    }}
  ]
}}
"""

    response = ask_ai(prompt)

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        parsed = json.loads(cleaned.strip())
    except Exception:
        raise HTTPException(500, f"Could not parse dashboard response: {response}")

    return {"status": "success", "dashboards": parsed.get("dashboards", [])}