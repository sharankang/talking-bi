import json
from fastapi import APIRouter, HTTPException
from services.supabase_client import supabase
from services.ai_client import ask_ai

router = APIRouter()

TABLES = ["customers", "orders", "order_items", "products", "category_translation"]


@router.get("/explore")
def explore_data():
    schema_info = {}
    samples = {}

    for table in TABLES:
        try:
            result = supabase.rpc("get_table_schema", {"table_name": table}).execute()
            schema_info[table] = result.data
            sample = supabase.table(table).select("*").limit(3).execute()
            samples[table] = sample.data
        except Exception as e:
            schema_info[table] = f"Error: {str(e)}"
            samples[table] = []

    prompt = f"""
You are a senior data analyst. A retail company has the following database tables:

Schema:
{json.dumps(schema_info, indent=2)}

Sample rows:
{json.dumps(samples, indent=2)}

Analyse this and return only valid JSON, no markdown backticks:
{{
  "business_description": "2-3 sentence description of what this business does",
  "tables": {{
    "table_name": {{
      "purpose": "what this table stores",
      "metric_columns": ["numeric cols worth measuring"],
      "dimension_columns": ["categorical cols to group by"]
    }}
  }},
  "relationships": [
    "orders.customer_id links to customers.customer_id",
    "order_items.order_id links to orders.order_id",
    "order_items.product_id links to products.product_id",
    "products.product_category_name links to category_translation.product_category_name"
  ],
  "suggested_kpis": [
    {{
      "name": "KPI name",
      "description": "what it measures",
      "tables_needed": ["table1", "table2"],
      "sql_hint": "SELECT ... FROM ... JOIN ... GROUP BY ..."
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
        parsed = {"raw_response": response}

    return {"status": "success", "exploration": parsed}