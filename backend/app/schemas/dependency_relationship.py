from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.dependency_relationship import DependencyType


class DependencyRelationshipCreate(BaseModel):
    source_service_id: UUID
    target_service_id: UUID
    relationship_type: DependencyType
    is_critical: bool = False
    notes: str | None = Field(
        default=None,
        max_length=1000,
    )


class DependencyRelationshipResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    source_service_id: UUID
    target_service_id: UUID
    relationship_type: DependencyType
    is_critical: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime
