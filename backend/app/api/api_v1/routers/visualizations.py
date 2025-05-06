from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.db import crud, schemas, models
from app.core.auth import get_current_active_user, get_current_active_superuser

visualizations_router = r = APIRouter()


@r.post("/visualizations", response_model=schemas.VisualizationOut)
async def create_visualization(
        request: Request,
        visualization: schemas.VisualizationCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new visualization
    """
    # Create the visualization
    db_viz = crud.create_visualization(db, visualization, current_user.id)

    # Log the action
    crud.log_action(
        db,
        current_user.id,
        "CREATE",
        "Visualization",
        db_viz.id,
        {"name": visualization.name, "type": visualization.type},
        request.client.host
    )

    return db_viz

@r.get("/visualizations", response_model=List[schemas.VisualizationOut])
async def read_visualizations(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all visualizations (created by user or public)
    """
    visualizations = crud.get_visualizations(db, skip, limit, current_user.id)
    return visualizations


@r.get("/visualizations/{viz_id}", response_model=schemas.VisualizationOut)
async def read_visualization(
    request: Request,
    viz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific visualization by ID
    """
    visualization = crud.get_visualization(db, viz_id, current_user.id)
    return visualization


@r.put("/visualizations/{viz_id}", response_model=schemas.VisualizationOut)
async def update_visualization(
    request: Request,
    viz_id: int,
    visualization: schemas.VisualizationEdit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a visualization
    """
    db_viz = crud.update_visualization(db, viz_id, visualization, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "UPDATE", 
        "Visualization", 
        viz_id, 
        visualization.dict(exclude_unset=True),
        request.client.host
    )
    
    return db_viz


@r.delete("/visualizations/{viz_id}", response_model=schemas.VisualizationOut)
async def delete_visualization(
    request: Request,
    viz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a visualization
    """
    db_viz = crud.delete_visualization(db, viz_id, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "DELETE", 
        "Visualization", 
        viz_id, 
        {"name": db_viz.name},
        request.client.host
    )
    
    return db_viz


@r.get("/datasets/{dataset_id}/visualizations", response_model=List[schemas.VisualizationOut])
async def get_dataset_visualizations(
    dataset_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all visualizations for a specific dataset
    """
    # Check if user has access to the dataset
    dataset = crud.get_dataset(db, dataset_id, current_user.id)
    
    # Get visualizations for this dataset
    visualizations = db.query(models.Visualization).filter(
        models.Visualization.dataset_id == dataset_id,
        (models.Visualization.creator_id == current_user.id) | (models.Visualization.is_public == True)
    ).offset(skip).limit(limit).all()
    
    return visualizations