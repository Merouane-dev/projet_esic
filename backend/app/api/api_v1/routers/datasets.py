from fastapi import APIRouter, Depends, File, UploadFile, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd

from app.db.session import get_db
from app.db import crud, schemas, models
from app.core.auth import get_current_active_user, get_current_active_superuser

datasets_router = r = APIRouter()


@r.post("/datasets", response_model=schemas.DatasetOut)
async def create_dataset(
    request: Request,
    dataset: schemas.DatasetCreate = Depends(),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Upload a new dataset (CSV or XLSX file)
    """
    # Create the dataset
    db_dataset = crud.create_dataset(db, dataset, file, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "CREATE", 
        "Dataset", 
        db_dataset.id, 
        {"name": dataset.name},
        request.client.host
    )
    
    return db_dataset


@r.get("/datasets", response_model=List[schemas.DatasetOut])
async def read_datasets(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all datasets (owned by user or public)
    """
    datasets = crud.get_datasets(db, skip, limit, current_user.id)
    return datasets


@r.get("/datasets/{dataset_id}", response_model=schemas.DatasetOut)
async def read_dataset(
    request: Request,
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific dataset by ID
    """
    dataset = crud.get_dataset(db, dataset_id, current_user.id)
    return dataset


@r.put("/datasets/{dataset_id}", response_model=schemas.DatasetOut)
async def update_dataset(
    request: Request,
    dataset_id: int,
    dataset: schemas.DatasetEdit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a dataset (metadata only)
    """
    db_dataset = crud.update_dataset(db, dataset_id, dataset, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "UPDATE", 
        "Dataset", 
        dataset_id, 
        dataset.dict(exclude_unset=True),
        request.client.host
    )
    
    return db_dataset


@r.delete("/datasets/{dataset_id}", response_model=schemas.DatasetOut)
async def delete_dataset(
    request: Request,
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a dataset
    """
    db_dataset = crud.delete_dataset(db, dataset_id, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "DELETE", 
        "Dataset", 
        dataset_id, 
        {"name": db_dataset.name},
        request.client.host
    )
    
    return db_dataset


@r.get("/datasets/{dataset_id}/preview")
async def preview_dataset(
    request: Request,
    dataset_id: int,
    n_rows: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Preview first n rows of a dataset
    """
    preview_data = crud.preview_dataset(db, dataset_id, current_user.id, n_rows)
    return preview_data


@r.get("/datasets/{dataset_id}/analyze")
async def analyze_dataset(
    request: Request,
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get basic statistics for a dataset
    """
    dataset = crud.get_dataset(db, dataset_id, current_user.id)
    
    # Load the dataset
    if dataset.file_type == "csv":
        df = pd.read_csv(dataset.file_path)
    elif dataset.file_type in ["xlsx", "xls"]:
        df = pd.read_excel(dataset.file_path)
    else:
        return {"error": "Unsupported file type"}
    
    # Get basic statistics
    numeric_columns = df.select_dtypes(include=['number']).columns
    stats = {}
    
    if not numeric_columns.empty:
        stats["summary"] = df[numeric_columns].describe().to_dict()
    
    # Missing values
    missing_values = df.isnull().sum().to_dict()
    stats["missing_values"] = {col: count for col, count in missing_values.items() if count > 0}
    
    # Data types
    stats["data_types"] = {col: str(dtype) for col, dtype in df.dtypes.items()}
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "ANALYZE", 
        "Dataset", 
        dataset_id, 
        None,
        request.client.host
    )
    
    return stats