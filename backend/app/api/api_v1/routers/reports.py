from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from fastapi.responses import StreamingResponse

from app.db.session import get_db
from app.db import crud, schemas, models
from app.core.auth import get_current_active_user, get_current_active_superuser

reports_router = r = APIRouter()


@r.post("/reports", response_model=schemas.ReportOut)
async def create_report(
    request: Request,
    report: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new report
    """
    # Create the report
    db_report = crud.create_report(db, report, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "CREATE", 
        "Report", 
        db_report.id, 
        {"name": report.name},
        request.client.host
    )
    
    return db_report


@r.get("/reports", response_model=List[schemas.ReportOut])
async def read_reports(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all reports (created by user or public)
    """
    reports = crud.get_reports(db, skip, limit, current_user.id)
    return reports


@r.get("/reports/{report_id}", response_model=schemas.ReportOut)
async def read_report(
    request: Request,
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific report by ID
    """
    report = crud.get_report(db, report_id, current_user.id)
    return report


@r.put("/reports/{report_id}", response_model=schemas.ReportOut)
async def update_report(
    request: Request,
    report_id: int,
    report: schemas.ReportEdit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a report
    """
    db_report = crud.update_report(db, report_id, report, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "UPDATE", 
        "Report", 
        report_id, 
        report.dict(exclude_unset=True, exclude={"visualization_ids"}),
        request.client.host
    )
    
    return db_report


@r.delete("/reports/{report_id}", response_model=schemas.ReportOut)
async def delete_report(
    request: Request,
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a report
    """
    db_report = crud.delete_report(db, report_id, current_user.id)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "DELETE", 
        "Report", 
        report_id, 
        {"name": db_report.name},
        request.client.host
    )
    
    return db_report


@r.get("/reports/{report_id}/export-pdf")
async def export_report_pdf(
    request: Request,
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Export a report as PDF
    """
    # Get the report
    report = crud.get_report(db, report_id, current_user.id)
    
    # Create a PDF using ReportLab
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Add title
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, report.name)
    
    # Add description if available
    if report.description:
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 80, report.description)
    
    # Add content if available (simplified, actual implementation would need HTML->PDF conversion)
    if report.content:
        c.setFont("Helvetica", 10)
        # Very simple text rendering, in a real implementation you'd use a HTML->PDF converter
        y_position = height - 120
        for line in report.content.split('\n'):
            c.drawString(50, y_position, line[:80])  # Truncate long lines
            y_position -= 15
            if y_position < 50:  # Start a new page if we run out of space
                c.showPage()
                y_position = height - 50
    
    c.showPage()
    c.save()
    buffer.seek(0)
    
    # Log the action
    crud.log_action(
        db, 
        current_user.id, 
        "EXPORT", 
        "Report", 
        report_id, 
        {"format": "PDF"},
        request.client.host
    )
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"}
    )


@r.get("/datasets/{dataset_id}/reports", response_model=List[schemas.ReportOut])
async def get_dataset_reports(
    dataset_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all reports for a specific dataset
    """
    # Check if user has access to the dataset
    dataset = crud.get_dataset(db, dataset_id, current_user.id)
    
    # Get reports for this dataset
    reports = db.query(models.Report).filter(
        models.Report.dataset_id == dataset_id,
        (models.Report.creator_id == current_user.id) | (models.Report.is_public == True)
    ).offset(skip).limit(limit).all()
    
    return reports