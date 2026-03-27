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


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    dashboard_context: dict
    history: Optional[List[Message]] = []


def run_query(sql: str) -> list:
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        cur = conn.cursor()
        cur.execute(sql)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(zip(cols, row)) for row in rows]
    except Exception as e:
        return [{"error": str(e)}]


@router.post("/chat")
def chat(req: ChatRequest):
    history_str = ""
    for msg in req.history[-6:]:
        history_str += f"{msg.role.upper()}: {msg.content}\n"

    schema_context = """
Available tables:
- customers(customer_id, customer_unique_id, customer_city, customer_state)
- orders(order_id, customer_id, order_status, order_purchase_timestamp)
- order_items(order_id, product_id, price, freight_value)
- products(product_id, product_category_name)
- category_translation(product_category_name, product_category_name_english)
"""

    prompt = f"""
You are a conversational BI analyst for a Brazilian e-commerce company.
The user is analysing a dashboard and asking questions.

{schema_context}

Current dashboard:
{json.dumps(req.dashboard_context, indent=2)}

Conversation so far:
{history_str}

User question: "{req.message}"

If the user asks for filtered or new data, generate a SQL query to answer it.

Return only valid JSON, no markdown backticks:
{{
  "answer": "Conversational answer to the user's question",
  "sql_query": "SELECT ... (or null if no query needed)",
  "insight_scores": {{
    "accuracy": 4,
    "relevance": 5,
    "novelty": 3
  }},
  "follow_up_suggestions": ["Question 1?", "Question 2?"]
}}

insight_scores 1-5:
- accuracy: is this grounded in the actual data shown?
- relevance: does it directly answer what was asked?
- novelty: does it reveal something non-obvious?
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
        raise HTTPException(500, f"Could not parse chat response: {response}")

    # if Gemini generated a SQL query, run it and attach results
    sql = parsed.get("sql_query")
    query_results = None
    if sql and sql.lower() != "null" and sql.strip():
        query_results = run_query(sql)

    return {
        "status": "success",
        "response": parsed,
        "query_results": query_results
    }