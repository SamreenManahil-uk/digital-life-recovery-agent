from datetime import datetime, timezone
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user_id,
    get_db,
    require_current_user,
)
from app.models.incident import Incident
from app.models.recovery_action import (
    RecoveryAction,
    RecoveryActionStatus,
)
from app.models.recovery_plan import (
    RecoveryPlan,
    RecoveryPlanStatus,
)
from app.schemas.recovery_plan import (
    RecoveryActionResponse,
    RecoveryActionUpdate,
    RecoveryPlanDetailResponse,
)
from app.services.recovery_plan_generator import (
    generate_recovery_plan,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["recovery-plans"],
)


def require_owned_plan(
    plan_id: UUID,
    user_id: UUID,
    db: Session,
) -> RecoveryPlan:
    plan = db.execute(
        select(RecoveryPlan).where(
            RecoveryPlan.id == plan_id,
            RecoveryPlan.user_id == user_id,
        )
    ).scalar_one_or_none()

    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery plan not found.",
        )

    return plan


def require_owned_action(
    action_id: UUID,
    user_id: UUID,
    db: Session,
) -> RecoveryAction:
    action = db.execute(
        select(RecoveryAction).where(
            RecoveryAction.id == action_id,
            RecoveryAction.user_id == user_id,
        )
    ).scalar_one_or_none()

    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery action not found.",
        )

    return action


def build_plan_response(
    plan: RecoveryPlan,
    db: Session,
) -> RecoveryPlanDetailResponse:
    actions = list(
        db.execute(
            select(RecoveryAction)
            .where(
                RecoveryAction.recovery_plan_id
                == plan.id,
                RecoveryAction.user_id
                == plan.user_id,
            )
            .order_by(
                RecoveryAction.step_order.asc()
            )
        ).scalars().all()
    )

    return RecoveryPlanDetailResponse(
        id=plan.id,
        user_id=plan.user_id,
        incident_id=plan.incident_id,
        status=plan.status,
        title=plan.title,
        summary=plan.summary,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        actions=[
            RecoveryActionResponse.model_validate(
                action
            )
            for action in actions
        ],
    )


@router.post(
    "/incidents/{incident_id}/recovery-plan",
    response_model=RecoveryPlanDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_recovery_plan(
    incident_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryPlanDetailResponse:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    incident = db.execute(
        select(Incident).where(
            Incident.id == incident_id,
            Incident.user_id == user_id,
        )
    ).scalar_one_or_none()

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found.",
        )

    try:
        plan = generate_recovery_plan(
            db=db,
            user_id=user_id,
            incident_id=incident_id,
        )

        db.commit()
        db.refresh(plan)

    except ValueError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return build_plan_response(
        plan=plan,
        db=db,
    )


@router.get(
    "/recovery-plans/{plan_id}",
    response_model=RecoveryPlanDetailResponse,
)
def get_recovery_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryPlanDetailResponse:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    plan = require_owned_plan(
        plan_id=plan_id,
        user_id=user_id,
        db=db,
    )

    return build_plan_response(
        plan=plan,
        db=db,
    )


@router.get(
    "/incidents/{incident_id}/recovery-plan",
    response_model=RecoveryPlanDetailResponse,
)
def get_incident_recovery_plan(
    incident_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryPlanDetailResponse:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    incident = db.execute(
        select(Incident).where(
            Incident.id == incident_id,
            Incident.user_id == user_id,
        )
    ).scalar_one_or_none()

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found.",
        )

    plan = db.execute(
        select(RecoveryPlan)
        .where(
            RecoveryPlan.incident_id
            == incident_id,
            RecoveryPlan.user_id
            == user_id,
        )
        .order_by(
            RecoveryPlan.created_at.desc()
        )
    ).scalars().first()

    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery plan not found.",
        )

    return build_plan_response(
        plan=plan,
        db=db,
    )


@router.patch(
    "/recovery-actions/{action_id}",
    response_model=RecoveryActionResponse,
)
def update_recovery_action(
    action_id: UUID,
    payload: RecoveryActionUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryAction:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    action = require_owned_action(
        action_id=action_id,
        user_id=user_id,
        db=db,
    )

    now = datetime.now(timezone.utc)

    action.status = payload.status

    if payload.status == RecoveryActionStatus.IN_PROGRESS:
        if action.started_at is None:
            action.started_at = now

        action.completed_at = None

    elif payload.status == RecoveryActionStatus.COMPLETED:
        if action.started_at is None:
            action.started_at = now

        action.completed_at = now

    elif payload.status in {
        RecoveryActionStatus.PENDING,
        RecoveryActionStatus.BLOCKED,
        RecoveryActionStatus.FAILED,
        RecoveryActionStatus.SKIPPED,
    }:
        action.completed_at = None

    db.flush()

    plan = require_owned_plan(
        plan_id=action.recovery_plan_id,
        user_id=user_id,
        db=db,
    )

    plan_actions = list(
        db.execute(
            select(RecoveryAction).where(
                RecoveryAction.recovery_plan_id
                == plan.id,
                RecoveryAction.user_id
                == user_id,
            )
        ).scalars().all()
    )

    if plan_actions and all(
        item.status
        in {
            RecoveryActionStatus.COMPLETED,
            RecoveryActionStatus.SKIPPED,
        }
        for item in plan_actions
    ):
        plan.status = RecoveryPlanStatus.COMPLETED

    elif any(
        item.status
        == RecoveryActionStatus.IN_PROGRESS
        for item in plan_actions
    ):
        plan.status = RecoveryPlanStatus.IN_PROGRESS

    elif any(
        item.status
        in {
            RecoveryActionStatus.BLOCKED,
            RecoveryActionStatus.FAILED,
        }
        for item in plan_actions
    ):
        plan.status = RecoveryPlanStatus.IN_PROGRESS

    else:
        plan.status = RecoveryPlanStatus.READY

    db.commit()
    db.refresh(action)

    return action
