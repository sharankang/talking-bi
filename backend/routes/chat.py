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

    prompt = f"""
You are a conversational BI analyst. Always respond in English.

Dashboard context:
{json.dumps(req.dashboard_context, indent=2)}

Conversation so far:
{history_str}

User question: "{req.message}"

Return only valid JSON, no markdown backticks:
{{
  "answer": "Your conversational answer in English",
  "sql_query": "SELECT ... or null if no query needed",
  "insight_scores": {{
    "accuracy": 4,
    "relevance": 5,
    "novelty": 3
  }},
  "follow_up_suggestions": ["Question 1?", "Question 2?"]
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
        raise HTTPException(500, f"Could not parse chat response: {response}")

    sql = parsed.get("sql_query")
    query_results = None
    if sql and sql.lower() != "null" and sql.strip():
        query_results = run_query(sql)

    return {
        "status": "success",
        "response": parsed,
        "query_results": query_results
    }