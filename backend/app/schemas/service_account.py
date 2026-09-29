from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.service_account import ServiceType


class ServiceAccountBase(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=150,
    )

    provider: str | None = Field(
        default=None,
        max_length=100,
    )

    service_type: ServiceType

    criticality: int = Field(
        default=3,
        ge=1,
        le=5,
    )

    description: str | None = None


class ServiceAccountCreate(ServiceAccountBase):
    pass


class ServiceAccountUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    provider: str | None = Field(
        default=None,
        max_length=100,
    )

    service_type: ServiceType | None = None

    criticality: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    description: str | None = None

    is_active: bool | None = None


class ServiceAccountResponse(ServiceAccountBase):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
