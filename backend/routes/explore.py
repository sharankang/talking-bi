import json
import os
import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_client import ask_ai

router = APIRouter()


class ExploreRequest(BaseModel):
    db_url: str


def get_schema_from_db(db_url: str) -> dict:
    """Read all tables and columns from any PostgreSQL database."""
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        # get all user tables
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [r[0] for r in cur.fetchall()]

        schema = {}
        samples = {}

        for table in tables:
            # get columns
            cur.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = %s
                ORDER BY ordinal_position;
            """, (table,))
            cols = cur.fetchall()
            schema[table] = [{"column": c[0], "type": c[1]} for c in cols]

            # get sample rows
            try:
                cur.execute(f'SELECT * FROM "{table}" LIMIT 3')
                col_names = [d[0] for d in cur.description]
                rows = cur.fetchall()
                samples[table] = [dict(zip(col_names, row)) for row in rows]
            except Exception:
                samples[table] = []

        cur.close()
        conn.close()
        return {"schema": schema, "samples": samples, "tables": tables}

    except Exception as e:
        raise HTTPException(500, f"Could not connect to database: {str(e)}")


@router.post("/explore")
def explore_data(req: ExploreRequest):
    db_info = get_schema_from_db(req.db_url)

    # build schema string for Gemini
    schema_str = ""
    for table, cols in db_info["schema"].items():
        col_list = ", ".join([f"{c['column']} ({c['type']})" for c in cols])
        schema_str += f"\nTable: {table}\nColumns: {col_list}\n"

    prompt = f"""
You are a senior data analyst. A user has connected a database with the following schema:

{schema_str}

Sample data:
{json.dumps({k: v for k, v in db_info['samples'].items()}, indent=2, default=str)}

Analyse this database and return only valid JSON, no markdown backticks:
{{
  "business_description": "2-3 sentence description of what this data is about",
  "tables": {{
    "table_name": {{
      "purpose": "what this table stores",
      "metric_columns": ["numeric columns worth measuring"],
      "dimension_columns": ["categorical columns to group by"],
      "time_columns": ["date or timestamp columns if any"]
    }}
  }},
  "relationships": [
    "table1.col links to table2.col"
  ],
  "suggested_kpis": [
    {{
      "name": "KPI name",
      "description": "what it measures and why it matters",
      "tables_needed": ["table1"],
      "sql_hint": "SELECT ... FROM ... GROUP BY ..."
    }}
  ]
}}

Only suggest KPIs based on columns that actually exist.
Always respond in English.
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
        parsed = {"raw_response": response}

    return {
        "status": "success",
        "exploration": parsed,
        "tables": db_info["tables"],
        "schema": db_info["schema"],
        "samples": db_info["samples"],
    }