from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import explore, analyse, chat, sessions, upload

app = FastAPI(title="Talking BI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(explore.router,   tags=["Explore"])
app.include_router(analyse.router,   tags=["Analyse"])
app.include_router(chat.router,      tags=["Chat"])
app.include_router(sessions.router,  tags=["Sessions"])
app.include_router(upload.router,    tags=["Upload"])

@app.get("/")
def root():
    return {"status": "Talking BI API is running"}