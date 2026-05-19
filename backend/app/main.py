from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import init_db
from app.api import auth, risk, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="灾害风险评估系统", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(risk.router)
app.include_router(websocket.router)

# Serve frontend static files
import os
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "dist")
if os.path.exists(frontend_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dir, "assets")), name="assets")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "灾害风险评估系统"}


@app.get("/{full_path:path}")
async def serve_spa(full_path: str = ""):
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "dist")
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path) and not full_path.startswith("api/"):
        return FileResponse(index_path)
    return {"detail": "Not Found"}

