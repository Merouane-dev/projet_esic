from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, Float, Table
from sqlalchemy.orm import relationship
import datetime
from typing import List

from .session import Base


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # Relations
    datasets = relationship("Dataset", back_populates="owner")
    visualizations = relationship("Visualization", back_populates="creator")
    reports = relationship("Report", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")


class Dataset(Base):
    __tablename__ = "dataset"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # CSV, XLSX
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    row_count = Column(Integer)
    column_count = Column(Integer)
    is_public = Column(Boolean, default=False)

    # Foreign keys
    owner_id = Column(Integer, ForeignKey("user.id"))

    # Relations
    owner = relationship("User", back_populates="datasets")
    columns = relationship("DatasetColumn", back_populates="dataset")
    visualizations = relationship("Visualization", back_populates="dataset")
    reports = relationship("Report", back_populates="dataset")


class DatasetColumn(Base):
    __tablename__ = "dataset_column"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    data_type = Column(String, nullable=False)  # string, number, date, boolean
    description = Column(String)
    is_nullable = Column(Boolean, default=True)

    # Foreign keys
    dataset_id = Column(Integer, ForeignKey("dataset.id"))

    # Relations
    dataset = relationship("Dataset", back_populates="columns")


class Visualization(Base):
    __tablename__ = "visualization"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    type = Column(String, nullable=False)  # bar, line, pie, scatter, table, etc.
    config = Column(Text, nullable=False)  # JSON configuration
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_public = Column(Boolean, default=False)

    # Foreign keys
    creator_id = Column(Integer, ForeignKey("user.id"))
    dataset_id = Column(Integer, ForeignKey("dataset.id"))

    # Relations
    creator = relationship("User", back_populates="visualizations")
    dataset = relationship("Dataset", back_populates="visualizations")

    # Many-to-many relationship with Report
    reports = relationship("Report", secondary="report_visualization", back_populates="visualizations")


# Association table for Report-Visualization relationship
report_visualization = Table(
    "report_visualization",
    Base.metadata,
    Column("report_id", Integer, ForeignKey("report.id"), primary_key=True),
    Column("visualization_id", Integer, ForeignKey("visualization.id"), primary_key=True)
)


class Report(Base):
    __tablename__ = "report"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    content = Column(Text)  # HTML or Markdown content
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_public = Column(Boolean, default=False)

    # Foreign keys
    creator_id = Column(Integer, ForeignKey("user.id"))
    dataset_id = Column(Integer, ForeignKey("dataset.id"))

    # Relations
    creator = relationship("User", back_populates="reports")
    dataset = relationship("Dataset", back_populates="reports")
    visualizations = relationship("Visualization", secondary="report_visualization", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # CRUD action
    entity_type = Column(String, nullable=False)  # User, Dataset, Visualization, Report
    entity_id = Column(Integer, nullable=False)
    details = Column(Text)  # Additional details in JSON format
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Foreign keys
    user_id = Column(Integer, ForeignKey("user.id"))

    # Relations
    user = relationship("User", back_populates="audit_logs")