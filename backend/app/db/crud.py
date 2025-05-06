import json
from fastapi import UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
import os
from typing import List, Optional, Dict, Any

from . import models, schemas
from app.core.security import get_password_hash


def get_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_user_by_email(db: Session, email: str) -> schemas.UserBase:
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(
    db: Session, skip: int = 0, limit: int = 100
) -> t.List[schemas.UserOut]:
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return user


def edit_user(
    db: Session, user_id: int, user: schemas.UserEdit
) -> schemas.User:
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    update_data = user.dict(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(user.password)
        del update_data["password"]

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Dataset CRUD operations
def create_dataset(db: Session, dataset: schemas.DatasetCreate, file: UploadFile, user_id: int):
    # Save file to disk
    file_location = f"data/uploads/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True)

    with open(file_location, "wb") as f:
        f.write(file.file.read())

    # Determine file type and load data for preview
    file_type = file.filename.split(".")[-1].lower()

    if file_type == "csv":
        df = pd.read_csv(file_location)
    elif file_type in ["xlsx", "xls"]:
        df = pd.read_excel(file_location)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV or XLSX files.")

    # Create dataset in database
    db_dataset = models.Dataset(
        name=dataset.name,
        description=dataset.description,
        file_path=file_location,
        file_type=file_type,
        row_count=len(df),
        column_count=len(df.columns),
        is_public=dataset.is_public,
        owner_id=user_id
    )

    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)

    # Create dataset columns
    for column in df.columns:
        data_type = str(df[column].dtype)
        db_column = models.DatasetColumn(
            name=column,
            data_type=data_type,
            dataset_id=db_dataset.id
        )
        db.add(db_column)

    db.commit()
    db.refresh(db_dataset)

    return db_dataset


def get_datasets(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None):
    """Get all datasets accessible by the user (owned or public)"""
    query = db.query(models.Dataset)

    if user_id:
        query = query.filter(
            (models.Dataset.owner_id == user_id) | (models.Dataset.is_public == True)
        )

    return query.offset(skip).limit(limit).all()


def get_dataset(db: Session, dataset_id: int, user_id: Optional[int] = None):
    """Get a specific dataset if accessible by the user"""
    query = db.query(models.Dataset).filter(models.Dataset.id == dataset_id)

    if user_id:
        query = query.filter(
            (models.Dataset.owner_id == user_id) | (models.Dataset.is_public == True)
        )

    dataset = query.first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return dataset


def update_dataset(db: Session, dataset_id: int, dataset: schemas.DatasetEdit, user_id: int):
    db_dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.owner_id == user_id
    ).first()

    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or you don't have permission to edit")

    update_data = dataset.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_dataset, key, value)

    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset


def delete_dataset(db: Session, dataset_id: int, user_id: int):
    db_dataset = db.query(models.Dataset).filter(
        models.Dataset.id == dataset_id,
        models.Dataset.owner_id == user_id
    ).first()

    if not db_dataset:
        raise HTTPException(status_code=404, detail="Dataset not found or you don't have permission to delete")

    # Delete the file
    try:
        os.remove(db_dataset.file_path)
    except:
        pass  # Ignore errors if file doesn't exist

    db.delete(db_dataset)
    db.commit()
    return db_dataset


def preview_dataset(db: Session, dataset_id: int, user_id: Optional[int] = None, n_rows: int = 10):
    """Preview the first n rows of a dataset"""
    dataset = get_dataset(db, dataset_id, user_id)

    if dataset.file_type == "csv":
        df = pd.read_csv(dataset.file_path, nrows=n_rows)
    elif dataset.file_type in ["xlsx", "xls"]:
        df = pd.read_excel(dataset.file_path, nrows=n_rows)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return df.to_dict(orient="records")


# Visualization CRUD operations
def create_visualization(db: Session, viz: schemas.VisualizationCreate, user_id: int):
    # Verify dataset exists and user has access
    dataset = get_dataset(db, viz.dataset_id, user_id)

    db_viz = models.Visualization(
        name=viz.name,
        description=viz.description,
        type=viz.type,
        config=viz.config,
        is_public=viz.is_public,
        creator_id=user_id,
        dataset_id=viz.dataset_id
    )

    db.add(db_viz)
    db.commit()
    db.refresh(db_viz)
    return db_viz


def get_visualizations(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None):
    """Get all visualizations accessible by the user (created by or public)"""
    query = db.query(models.Visualization)

    if user_id:
        query = query.filter(
            (models.Visualization.creator_id == user_id) | (models.Visualization.is_public == True)
        )

    return query.offset(skip).limit(limit).all()


def get_visualization(db: Session, viz_id: int, user_id: Optional[int] = None):
    """Get a specific visualization if accessible by the user"""
    query = db.query(models.Visualization).filter(models.Visualization.id == viz_id)

    if user_id:
        query = query.filter(
            (models.Visualization.creator_id == user_id) | (models.Visualization.is_public == True)
        )

    viz = query.first()

    if not viz:
        raise HTTPException(status_code=404, detail="Visualization not found")

    return viz


def update_visualization(db: Session, viz_id: int, viz: schemas.VisualizationEdit, user_id: int):
    db_viz = db.query(models.Visualization).filter(
        models.Visualization.id == viz_id,
        models.Visualization.creator_id == user_id
    ).first()

    if not db_viz:
        raise HTTPException(status_code=404, detail="Visualization not found or you don't have permission to edit")

    update_data = viz.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_viz, key, value)

    db.add(db_viz)
    db.commit()
    db.refresh(db_viz)
    return db_viz


def delete_visualization(db: Session, viz_id: int, user_id: int):
    db_viz = db.query(models.Visualization).filter(
        models.Visualization.id == viz_id,
        models.Visualization.creator_id == user_id
    ).first()

    if not db_viz:
        raise HTTPException(status_code=404, detail="Visualization not found or you don't have permission to delete")

    db.delete(db_viz)
    db.commit()
    return db_viz


# Report CRUD operations
def create_report(db: Session, report: schemas.ReportCreate, user_id: int):
    # Verify dataset exists and user has access
    dataset = get_dataset(db, report.dataset_id, user_id)

    db_report = models.Report(
        name=report.name,
        description=report.description,
        content=report.content,
        is_public=report.is_public,
        creator_id=user_id,
        dataset_id=report.dataset_id
    )

    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Add visualizations if provided
    if report.visualization_ids:
        for viz_id in report.visualization_ids:
            # Check if visualization exists and user has access
            viz = get_visualization(db, viz_id, user_id)
            db_report.visualizations.append(viz)

        db.commit()
        db.refresh(db_report)

    return db_report


def get_reports(db: Session, skip: int = 0, limit: int = 100, user_id: Optional[int] = None):
    """Get all reports accessible by the user (created by or public)"""
    query = db.query(models.Report)

    if user_id:
        query = query.filter(
            (models.Report.creator_id == user_id) | (models.Report.is_public == True)
        )

    return query.offset(skip).limit(limit).all()


def get_report(db: Session, report_id: int, user_id: Optional[int] = None):
    """Get a specific report if accessible by the user"""
    query = db.query(models.Report).filter(models.Report.id == report_id)

    if user_id:
        query = query.filter(
            (models.Report.creator_id == user_id) | (models.Report.is_public == True)
        )

    report = query.first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


def update_report(db: Session, report_id: int, report: schemas.ReportEdit, user_id: int):
    db_report = db.query(models.Report).filter(
        models.Report.id == report_id,
        models.Report.creator_id == user_id
    ).first()

    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found or you don't have permission to edit")

    update_data = report.dict(exclude={"visualization_ids"}, exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_report, key, value)

    # Update visualizations if provided
    if report.visualization_ids is not None:
        # Clear existing visualizations
        db_report.visualizations = []

        # Add new visualizations
        for viz_id in report.visualization_ids:
            viz = get_visualization(db, viz_id, user_id)
            db_report.visualizations.append(viz)

    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def delete_report(db: Session, report_id: int, user_id: int):
    db_report = db.query(models.Report).filter(
        models.Report.id == report_id,
        models.Report.creator_id == user_id
    ).first()

    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found or you don't have permission to delete")

    db.delete(db_report)
    db.commit()
    return db_report


# Audit log functions
def log_action(db: Session, user_id: int, action: str, entity_type: str, entity_id: int, details: Optional[Dict] = None,
               ip_address: Optional[str] = None):
    """Log user actions for audit trail"""
    details_json = json.dumps(details) if details else None

    db_log = models.AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details_json,
        ip_address=ip_address,
        user_id=user_id
    )

    db.add(db_log)
    db.commit()
    return db_log


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100,
                   user_id: Optional[int] = None, entity_type: Optional[str] = None,
                   entity_id: Optional[int] = None, action: Optional[str] = None):
    """Get audit logs with optional filtering"""
    query = db.query(models.AuditLog)

    if user_id:
        query = query.filter(models.AuditLog.user_id == user_id)

    if entity_type:
        query = query.filter(models.AuditLog.entity_type == entity_type)

    if entity_id:
        query = query.filter(models.AuditLog.entity_id == entity_id)

    if action:
        query = query.filter(models.AuditLog.action == action)

    return query.order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()