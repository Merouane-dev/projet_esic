from pydantic import BaseModel, validator
import typing as t
from datetime import datetime


class UserBase(BaseModel):
    email: str
    is_active: bool = True
    is_superuser: bool = False
    first_name: str = None
    last_name: str = None


class UserOut(UserBase):
    pass


class UserCreate(UserBase):
    password: str

    class Config:
        orm_mode = True


class UserEdit(UserBase):
    password: t.Optional[str] = None

    class Config:
        orm_mode = True


class User(UserBase):
    id: int

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str = None
    permissions: str = "user"


# New schemas for Dataset
class DatasetColumnBase(BaseModel):
    name: str
    data_type: str
    description: t.Optional[str] = None
    is_nullable: bool = True


class DatasetColumnCreate(DatasetColumnBase):
    pass


class DatasetColumnEdit(DatasetColumnBase):
    pass


class DatasetColumn(DatasetColumnBase):
    id: int
    dataset_id: int

    class Config:
        orm_mode = True


class DatasetBase(BaseModel):
    name: str
    description: t.Optional[str] = None
    is_public: bool = False


class DatasetCreate(DatasetBase):
    file_type: str  # CSV, XLSX


class DatasetEdit(DatasetBase):
    pass


class DatasetOut(DatasetBase):
    id: int
    file_type: str
    created_at: datetime
    updated_at: datetime
    row_count: t.Optional[int]
    column_count: t.Optional[int]
    owner_id: int
    columns: t.List[DatasetColumn] = []

    class Config:
        orm_mode = True


# Schemas for Visualization
class VisualizationBase(BaseModel):
    name: str
    description: t.Optional[str] = None
    type: str  # bar, line, pie, scatter, table, etc.
    config: str  # JSON configuration
    is_public: bool = False


class VisualizationCreate(VisualizationBase):
    dataset_id: int


class VisualizationEdit(VisualizationBase):
    pass


class VisualizationOut(VisualizationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    creator_id: int
    dataset_id: int

    class Config:
        orm_mode = True


# Schemas for Report
class ReportBase(BaseModel):
    name: str
    description: t.Optional[str] = None
    content: t.Optional[str] = None
    is_public: bool = False


class ReportCreate(ReportBase):
    dataset_id: int
    visualization_ids: t.List[int] = []


class ReportEdit(ReportBase):
    visualization_ids: t.Optional[t.List[int]] = None


class ReportOut(ReportBase):
    id: int
    created_at: datetime
    updated_at: datetime
    creator_id: int
    dataset_id: int

    class Config:
        orm_mode = True


# Schema for AuditLog
class AuditLogOut(BaseModel):
    id: int
    action: str
    entity_type: str
    entity_id: int
    details: t.Optional[str] = None
    ip_address: t.Optional[str] = None
    timestamp: datetime
    user_id: int

    class Config:
        orm_mode = True