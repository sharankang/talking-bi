from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import explore, intent, dashboards, chat

app = FastAPI(title="Talking BI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(explore.router,    tags=["Explore"])
app.include_router(intent.router,     tags=["Intent"])
app.include_router(dashboards.router, tags=["Dashboards"])
app.include_router(chat.router,       tags=["Chat"])

@app.get("/")
def root():
    return {"status": "Talking BI API is running"}