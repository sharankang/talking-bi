import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_client import ask_ai

router = APIRouter()


class IntentRequest(BaseModel):
    user_input: str


@router.post("/parse-intent")
def parse_intent(req: IntentRequest):
    schema_context = """
Tables available:
- customers: customer_id, customer_unique_id, customer_city, customer_state, customer_zip_code_prefix
- orders: order_id, customer_id, order_status, order_purchase_timestamp, order_estimated_delivery_date
- order_items: order_id, order_item_id, product_id, seller_id, price, freight_value
- products: product_id, product_category_name, product_weight_g, product_length_cm
- category_translation: product_category_name, product_category_name_english

Relationships:
- orders.customer_id = customers.customer_id
- order_items.order_id = orders.order_id
- order_items.product_id = products.product_id
- products.product_category_name = category_translation.product_category_name

IMPORTANT RULES:
- For time-based trends, ALWAYS use "TO_CHAR(orders.order_purchase_timestamp::timestamp, 'YYYY-MM')" as the group_by_column
- For revenue/price metrics, use "order_items.price" as metric_column
- For category names in English, use "category_translation.product_category_name_english" as group_by_column
- For order counts, use "orders.order_id" as metric_column with aggregation "count"
- For customer counts, use "customers.customer_id" as metric_column with aggregation "count"
"""

    prompt = f"""
You are a BI assistant for a Brazilian e-commerce retail company.
Always respond in English regardless of the data's origin language.

Database schema:
{schema_context}

User request: "{req.user_input}"

Extract the analytical intent and return only valid JSON, no markdown backticks:
{{
  "kpis": [
    {{
      "name": "Human readable KPI name",
      "aggregation": "sum | avg | count | max | min",
      "metric_column": "column to aggregate with table prefix e.g. order_items.price",
      "group_by_column": "column to group by with table prefix e.g. customers.customer_state",
      "chart_type": "bar | line | pie",
      "requires_join": true,
      "join_hint": "optional join path if complex"
    }}
  ],
  "time_filter": "year as string e.g. 2018 or null",
  "status_filter": "e.g. delivered or null",
  "summary": "One sentence describing what the user wants"
}}

Only include KPIs that map to available columns.
For time trends, group_by_column must be: TO_CHAR(orders.order_purchase_timestamp::timestamp, 'YYYY-MM')
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
        raise HTTPException(500, f"Could not parse AI response: {response}")

    return {"status": "success", "intent": parsed}