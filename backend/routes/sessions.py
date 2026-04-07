from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase

router = APIRouter()


class SessionCreate(BaseModel):
    query: str
    summary: Optional[str] = None
    kpi_cards: Optional[list] = None
    dashboard_tabs: Optional[list] = None
    sql_used: Optional[list] = None
    dataset_preview: Optional[list] = None
    db_source: Optional[str] = None
    schema_summary: Optional[str] = None
    database_label: Optional[str] = None
    table_overview: Optional[dict] = None


@router.get("/sessions")
def get_sessions():
    try:
        result = supabase.table("sessions") \
            .select("id, query, summary, created_at, db_source, schema_summary, database_label, dataset_preview") \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        return {"status": "success", "sessions": result.data}
    except Exception as e:
        raise HTTPException(500, f"Could not fetch sessions: {str(e)}")


@router.get("/sessions/{session_id}")
def get_session(session_id: str):
    try:
        result = supabase.table("sessions") \
            .select("*") \
            .eq("id", session_id) \
            .single() \
            .execute()
        return {"status": "success", "session": result.data}
    except Exception as e:
        raise HTTPException(500, f"Could not fetch session: {str(e)}")


@router.post("/sessions")
def create_session(req: SessionCreate):
    try:
        result = supabase.table("sessions").insert({
            "query": req.query,
            "summary": req.summary,
            "kpi_cards": req.kpi_cards,
            "dashboard_tabs": req.dashboard_tabs,
            "sql_used": req.sql_used,
            "dataset_preview": req.dataset_preview,
            "db_source": req.db_source,
            "schema_summary": req.schema_summary,
            "database_label": req.database_label,
            "table_overview": req.table_overview,
        }).execute()
        return {"status": "success", "session": result.data[0]}
    except Exception as e:
        raise HTTPException(500, f"Could not save session: {str(e)}")


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    try:
        supabase.table("sessions").delete().eq("id", session_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(500, f"Could not delete session: {str(e)}")