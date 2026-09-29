from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_db,
    require_current_user,
)
from app.models.audit_event import (
    AuditEvent,
    AuditEventType,
)
from app.models.user import User
from app.schemas.audit_event import (
    AuditEventResponse,
)


router = APIRouter(
    prefix="/api/v1/audit-events",
    tags=["Audit Events"],
)


@router.get(
    "",
    response_model=list[AuditEventResponse],
)
def list_audit_events(
    event_type: AuditEventType | None = Query(
        default=None,
    ),
    entity_type: str | None = Query(
        default=None,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_current_user,
    ),
) -> list[AuditEventResponse]:
    statement = (
        select(AuditEvent)
        .where(
            AuditEvent.user_id ==
            current_user.id,
        )
        .order_by(
            AuditEvent.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    )

    if event_type is not None:
        statement = statement.where(
            AuditEvent.event_type ==
            event_type,
        )

    if entity_type:
        statement = statement.where(
            AuditEvent.entity_type ==
            entity_type,
        )

    events = (
        db.execute(statement)
        .scalars()
        .all()
    )

    return [
        AuditEventResponse.model_validate(
            event,
        )
        for event in events
    ]


@router.get(
    "/{event_id}",
    response_model=AuditEventResponse,
)
def get_audit_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_current_user,
    ),
) -> AuditEventResponse:
    event = db.execute(
        select(AuditEvent).where(
            AuditEvent.id == event_id,
            AuditEvent.user_id ==
            current_user.id,
        )
    ).scalar_one_or_none()

    if event is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Audit event not found.",
        )

    return AuditEventResponse.model_validate(
        event,
    )
