"""add dashboard models

Revision ID: 001_add_dashboard_models
Revises: 91979b40eb38
Create Date: 2025-05-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001_add_dashboard_models"
down_revision = "91979b40eb38"
branch_labels = None
depends_on = None


def upgrade():
    # Create dataset table
    op.create_table(
        "dataset",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000)),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("file_type", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("row_count", sa.Integer),
        sa.Column("column_count", sa.Integer),
        sa.Column("is_public", sa.Boolean, default=False),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("user.id"), nullable=False),
    )
    
    # Create dataset_column table
    op.create_table(
        "dataset_column",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("data_type", sa.String(50), nullable=False),
        sa.Column("description", sa.String(1000)),
        sa.Column("is_nullable", sa.Boolean, default=True),
        sa.Column("dataset_id", sa.Integer, sa.ForeignKey("dataset.id"), nullable=False),
    )
    
    # Create visualization table
    op.create_table(
        "visualization",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000)),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("config", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("is_public", sa.Boolean, default=False),
        sa.Column("creator_id", sa.Integer, sa.ForeignKey("user.id"), nullable=False),
        sa.Column("dataset_id", sa.Integer, sa.ForeignKey("dataset.id"), nullable=False),
    )
    
    # Create report table
    op.create_table(
        "report",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(1000)),
        sa.Column("content", sa.Text),
        sa.Column("created_at", sa.DateTime, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("is_public", sa.Boolean, default=False),
        sa.Column("creator_id", sa.Integer, sa.ForeignKey("user.id"), nullable=False),
        sa.Column("dataset_id", sa.Integer, sa.ForeignKey("dataset.id"), nullable=False),
    )
    
    # Create association table for report-visualization many-to-many relationship
    op.create_table(
        "report_visualization",
        sa.Column("report_id", sa.Integer, sa.ForeignKey("report.id"), primary_key=True),
        sa.Column("visualization_id", sa.Integer, sa.ForeignKey("visualization.id"), primary_key=True),
    )
    
    # Create audit_log table
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer, nullable=False),
        sa.Column("details", sa.Text),
        sa.Column("ip_address", sa.String(50)),
        sa.Column("timestamp", sa.DateTime, default=sa.func.now()),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("user.id"), nullable=False),
    )


def downgrade():
    # Drop tables in reverse order
    op.drop_table("audit_log")
    op.drop_table("report_visualization")
    op.drop_table("report")
    op.drop_table("visualization")
    op.drop_table("dataset_column")
    op.drop_table("dataset")