from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.db import crud, schemas, models
from app.core.auth import get_current_active_user, get_current_active_superuser

audit_router = r = APIRouter()


@r.get("/audit-logs", response_model=List[schemas.AuditLogOut])
async def get_audit_logs(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_superuser)  # Only superusers can see all logs
):
    """
    Get audit logs with optional filtering (admin only)
    """
    logs = crud.get_audit_logs(
        db, skip=skip, limit=limit, user_id=user_id, 
        entity_type=entity_type, entity_id=entity_id, action=action
    )
    return logs


@r.get("/audit-logs/my-activity", response_model=List[schemas.AuditLogOut])
async def get_my_activity(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get current user's activity logs with optional filtering
    """
    logs = crud.get_audit_logs(
        db, skip=skip, limit=limit, user_id=current_user.id, 
        entity_type=entity_type, entity_id=entity_id, action=action
    )
    return logs