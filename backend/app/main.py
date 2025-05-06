from fastapi import FastAPI, Depends
from starlette.requests import Request
import uvicorn
from starlette.middleware.cors import CORSMiddleware

from app.api.api_v1.routers.users import users_router
from app.api.api_v1.routers.auth import auth_router
from app.api.api_v1.routers.datasets import datasets_router
from app.api.api_v1.routers.visualizations import visualizations_router
from app.api.api_v1.routers.reports import reports_router
from app.api.api_v1.routers.audit import audit_router
from app.core import config
from app.db.session import SessionLocal
from app.core.auth import get_current_active_user
from app.core.celery_app import celery_app
from app import tasks


app = FastAPI(
    title=config.PROJECT_NAME, docs_url="/api/docs", openapi_url="/api"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you'd want to restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    request.state.db = SessionLocal()
    response = await call_next(request)
    request.state.db.close()
    return response


@app.get("/api/v1")
async def root():
    return {"message": "Hello World"}


@app.get("/api/v1/task")
async def example_task():
    celery_app.send_task("app.tasks.example_task", args=["Hello World"])
    return {"message": "success"}


# Routers
app.include_router(
    users_router,
    prefix="/api/v1",
    tags=["users"],
    dependencies=[Depends(get_current_active_user)],
)
app.include_router(auth_router, prefix="/api", tags=["auth"])

# New routers
app.include_router(
    datasets_router,
    prefix="/api/v1",
    tags=["datasets"],
    dependencies=[Depends(get_current_active_user)],
)
app.include_router(
    visualizations_router,
    prefix="/api/v1",
    tags=["visualizations"],
    dependencies=[Depends(get_current_active_user)],
)
app.include_router(
    reports_router,
    prefix="/api/v1",
    tags=["reports"],
    dependencies=[Depends(get_current_active_user)],
)
app.include_router(
    audit_router,
    prefix="/api/v1",
    tags=["audit"],
    dependencies=[Depends(get_current_active_user)],
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True, port=8888)