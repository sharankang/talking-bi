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


def get_schema_context(db_url: str) -> tuple:
    """Returns (schema_context_string, primary_table_name)"""
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [r[0] for r in cur.fetchall()]

        context = "Available tables:\n"
        primary_table = tables[0] if tables else None

        for table in tables:
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position;
            """, (table,))
            cols = cur.fetchall()
            col_str = ", ".join([f"{c[0]} ({c[1]})" for c in cols])
            context += f"- {table}({col_str})\n"

            try:
                cur.execute(f'SELECT * FROM "{table}" LIMIT 2')
                col_names = [d[0] for d in cur.description]
                rows = cur.fetchall()
                if rows:
                    context += f"  Sample: {dict(zip(col_names, rows[0]))}\n"
            except Exception:
                pass

        cur.close()
        conn.close()
        return context, primary_table

    except Exception as e:
        raise HTTPException(500, f"Could not read schema: {str(e)}")


def get_table_overview(db_url: str, table_name: str, limit: int = 10) -> dict:
    """Fetch column names and first N rows from a table."""
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        cur.execute(f'SELECT * FROM "{table_name}" LIMIT {limit}')
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        cur.close()
        conn.close()
        data = []
        for row in rows:
            record = {}
            for i, col in enumerate(cols):
                val = row[i]
                record[col] = str(val) if val is not None else None
            data.append(record)
        return {"table": table_name, "columns": cols, "rows": data}
    except Exception as e:
        return {"table": table_name, "columns": [], "rows": [], "error": str(e)}


def run_sql(db_url: str, sql: str) -> list:
    try:
        conn = psycopg2.connect(db_url)
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
    db_url: str


@router.post("/analyse")
def analyse(req: AnalyseRequest):
    schema_context, primary_table = get_schema_context(req.db_url)

    plan_prompt = f"""
You are a BI analyst. A user asked: "{req.query}"

Database schema:
{schema_context}

Generate a comprehensive analysis plan grounded in actual tables and columns above.
Always respond in English.
Return only valid JSON, no markdown backticks:
{{
  "summary": "One sentence describing the analysis",
  "primary_table": "most relevant table name for overview",
  "kpi_cards": [
    {{
      "label": "Metric name",
      "sql": "SELECT ... as value FROM ...",
      "format": "currency | number | percent"
    }}
  ],
  "tabs": [
    {{
      "name": "Tab name",
      "charts": [
        {{
          "title": "Chart title",
          "chart_type": "bar | line | pie",
          "sql": "SELECT col as label, agg as value FROM ... GROUP BY col ORDER BY value DESC LIMIT 15",
          "insight": "One sentence insight"
        }}
      ]
    }}
  ]
}}

Rules:
- Only use tables and columns that actually exist
- Generate 4 KPI cards most relevant to the query
- Generate 3-4 tabs with 2-3 charts each
- Chart SQL must return exactly two columns named 'label' and 'value'
- KPI SQL must return one row with a column named 'value'
- For time trends use TO_CHAR(date_col::timestamp, 'YYYY-MM') as label ordered ASC
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

    kpi_cards = []
    for card in plan.get("kpi_cards", []):
        sql = card.get("sql", "")
        data = run_sql(req.db_url, sql)
        value = data[0].get("value", 0) if data else 0
        sql_log.append({"label": card["label"], "sql": sql})
        kpi_cards.append({
            "label": card["label"],
            "value": value,
            "format": card.get("format", "number")
        })

    tabs = []
    for tab in plan.get("tabs", []):
        charts = []
        for chart in tab.get("charts", []):
            sql = chart.get("sql", "")
            data = run_sql(req.db_url, sql)
            sql_log.append({"label": chart["title"], "sql": sql})
            if data:
                charts.append({
                    "title": chart["title"],
                    "chart_type": chart.get("chart_type", "bar"),
                    "insight": chart.get("insight", ""),
                    "data": data
                })
        if charts:
            tabs.append({"name": tab["name"], "charts": charts})

    # table overview — fetch from primary table
    overview_table = plan.get("primary_table") or primary_table
    table_overview = None
    if overview_table:
        table_overview = get_table_overview(req.db_url, overview_table, limit=10)

    return {
        "status": "success",
        "summary": plan.get("summary", ""),
        "kpi_cards": kpi_cards,
        "tabs": tabs,
        "sql_used": sql_log,
        "table_overview": table_overview,
    }