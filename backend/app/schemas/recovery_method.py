from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.recovery_method import RecoveryMethodType


class RecoveryMethodCreate(BaseModel):
    service_account_id: UUID

    method_type: RecoveryMethodType

    label: str = Field(
        min_length=1,
        max_length=150,
    )

    is_available: bool = True
    is_verified: bool = False
    is_primary: bool = False


class RecoveryMethodUpdate(BaseModel):
    label: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    is_available: bool | None = None
    is_verified: bool | None = None
    is_primary: bool | None = None


class RecoveryMethodResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    service_account_id: UUID

    method_type: RecoveryMethodType
    label: str

    is_available: bool
    is_verified: bool
    is_primary: bool

    created_at: datetime
    updated_at: datetime
