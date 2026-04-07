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
    db_url: str


def run_query(db_url: str, sql: str) -> list:
    try:
        conn = psycopg2.connect(db_url)
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

    prompt = f"""
You are a conversational BI analyst. Always respond in English.

Dashboard context (KPI cards and charts already shown to user):
{json.dumps(req.dashboard_context, indent=2)}

Conversation so far:
{history_str}

User question: "{req.message}"

Your job:
1. Answer the question conversationally
2. Generate a SQL query that fetches data to visualize the answer
3. Recommend the best chart type for that data
4. Score your own insight

Return only valid JSON, no markdown backticks:
{{
  "answer": "Conversational answer in English",
  "sql_query": "SELECT col as label, agg as value FROM table GROUP BY col ORDER BY value DESC LIMIT 15",
  "chart_type": "bar | line | pie",
  "chart_title": "Descriptive chart title",
  "insight_scores": {{
    "accuracy": 4,
    "relevance": 5,
    "novelty": 3
  }},
  "follow_up_suggestions": ["Question 1?", "Question 2?"]
}}

Rules:
- sql_query must return columns named exactly 'label' and 'value'
- Only use tables that exist in the dashboard context
- If the question doesn't need a chart, set sql_query to null
- insight scores are 1-5: accuracy=factually grounded, relevance=answers the question, novelty=non-obvious finding
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

    # execute the chart SQL
    chart_data = None
    sql = parsed.get("sql_query")
    if sql and sql.lower() != "null" and sql.strip():
        chart_data = run_query(req.db_url, sql)
        # filter out error rows
        if chart_data and "error" in chart_data[0]:
            chart_data = None

    return {
        "status": "success",
        "response": parsed,
        "chart_data": chart_data,
    }