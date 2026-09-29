from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.incident import (
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
)
from app.models.incident_impact import ImpactType


class IncidentCreate(BaseModel):
    root_service_id: UUID
    incident_type: IncidentType

    severity: IncidentSeverity = IncidentSeverity.MEDIUM

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = None


class IncidentUpdate(BaseModel):
    status: IncidentStatus | None = None
    severity: IncidentSeverity | None = None

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    root_service_id: UUID

    incident_type: IncidentType
    status: IncidentStatus
    severity: IncidentSeverity

    title: str
    description: str | None

    detected_at: datetime
    resolved_at: datetime | None

    created_at: datetime
    updated_at: datetime


class IncidentImpactResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    incident_id: UUID
    service_account_id: UUID

    impact_type: ImpactType
    dependency_depth: int
    impact_score: float

    is_access_blocked: bool
    explanation: str | None

    created_at: datetime


class IncidentAnalysisResponse(BaseModel):
    incident_id: UUID
    root_service_id: UUID
    affected_service_count: int

    impacts: list[IncidentImpactResponse]
