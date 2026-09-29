from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.recovery_action import (
    RecoveryActionStatus,
    RecoveryActionType,
)
from app.models.recovery_plan import RecoveryPlanStatus


class RecoveryActionResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    recovery_plan_id: UUID
    service_account_id: UUID

    step_order: int
    action_type: RecoveryActionType
    status: RecoveryActionStatus

    title: str
    instructions: str
    blocking_reason: str | None

    started_at: datetime | None
    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime


class RecoveryActionUpdate(BaseModel):
    status: RecoveryActionStatus


class RecoveryPlanResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    incident_id: UUID

    status: RecoveryPlanStatus

    title: str
    summary: str | None

    created_at: datetime
    updated_at: datetime


class RecoveryPlanDetailResponse(
    RecoveryPlanResponse
):
    actions: list[RecoveryActionResponse]
