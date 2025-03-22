from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api import workflows, marketplace, execution
from app.db.database import engine
from app.db.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Agent Marketplace",
    description="API for creating and executing AI agent workflows",
    version="0.1.0",
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workflows.router, prefix="/api", tags=["workflows"])
app.include_router(marketplace.router, prefix="/api", tags=["marketplace"])
app.include_router(execution.router, prefix="/api", tags=["execution"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Agent Marketplace API", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
