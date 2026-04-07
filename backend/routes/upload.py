import pandas as pd
import numpy as np
import re
import io
import os
import json
import psycopg2
from psycopg2.extras import execute_values
from fastapi import APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()


def sanitise_name(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r'[^a-z0-9_]', '_', name)
    name = re.sub(r'_+', '_', name)
    return name.strip('_')


def infer_pg_type(series: pd.Series) -> str:
    if pd.api.types.is_integer_dtype(series):
        return "bigint"
    if pd.api.types.is_float_dtype(series):
        return "float8"
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    return "text"


def clean_value(v):
    if isinstance(v, np.integer):
        return int(v)
    elif isinstance(v, np.floating):
        return float(v) if not np.isnan(v) else None
    elif isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
        return None
    return v


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(400, "Only CSV and Excel files are supported")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Could not read file: {str(e)}")

    df.columns = [sanitise_name(c) for c in df.columns]
    df = df.dropna(axis=1, how='all')

    if len(df) > 10000:
        df = df.head(10000)

    col_defs = []
    schema = {}
    for col in df.columns:
        pg_type = infer_pg_type(df[col])
        col_defs.append(f'"{col}" {pg_type}')
        schema[col] = pg_type

    table_name = "user_data"
    columns = list(df.columns)

    df = df.replace([np.inf, -np.inf], None)
    df = df.where(pd.notnull(df), None)
    records = [
        tuple(clean_value(row[c]) for c in columns)
        for row in df.to_dict(orient='records')
    ]

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(500, "DATABASE_URL not set — needed as scratch space for CSV uploads")

    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        cur = conn.cursor()
        cur.execute(f"DROP TABLE IF EXISTS {table_name};")
        col_defs_sql = ", ".join(col_defs)
        cur.execute(f"CREATE TABLE {table_name} (id bigserial primary key, {col_defs_sql});")
        col_names = ", ".join([f'"{c}"' for c in columns])
        execute_values(cur, f"INSERT INTO {table_name} ({col_names}) VALUES %s", records, page_size=1000)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(500, f"Database error: {str(e)}")

    # return preview rows
    preview = []
    for r in df.head(6).to_dict(orient='records'):
        preview.append({k: str(v) if v is not None else None for k, v in r.items()})

    return {
        "status": "success",
        "rows_loaded": len(records),
        "columns": schema,
        "table_name": table_name,
        "preview": preview,
        "db_url": database_url,
    }