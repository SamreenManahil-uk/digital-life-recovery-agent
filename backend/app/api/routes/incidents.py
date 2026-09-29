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
from app.models.audit_event import AuditEventType
from app.models.incident import (
    Incident,
    IncidentStatus,
)
from app.models.incident_impact import IncidentImpact
from app.models.service_account import ServiceAccount
from app.schemas.incident import (
    IncidentAnalysisResponse,
    IncidentCreate,
    IncidentImpactResponse,
    IncidentResponse,
    IncidentUpdate,
)
from app.services.incident_impact_service import (
    analyze_and_persist_incident_impacts,
)
from app.services.audit_service import record_audit_event


router = APIRouter(
    prefix="/api/v1/incidents",
    tags=["incidents"],
)


def require_owned_incident(
    incident_id: UUID,
    user_id: UUID,
    db: Session,
) -> Incident:
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

    return incident


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> Incident:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    root_service = db.execute(
        select(ServiceAccount).where(
            ServiceAccount.id == payload.root_service_id,
            ServiceAccount.user_id == user_id,
            ServiceAccount.is_active.is_(True),
        )
    ).scalar_one_or_none()

    if root_service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Root service not found.",
        )

    incident = Incident(
        user_id=user_id,
        root_service_id=payload.root_service_id,
        incident_type=payload.incident_type,
        severity=payload.severity,
        title=payload.title,
        description=payload.description,
        status=IncidentStatus.OPEN,
    )

    db.add(incident)
    db.flush()

    record_audit_event(
        db=db,
        user_id=user_id,
        event_type=AuditEventType.INCIDENT_CREATED,
        entity_type="incident",
        entity_id=incident.id,
        action="Created incident",
        description=f"Created incident: {incident.title}.",
        metadata={
            "title": incident.title,
            "incident_type": (
                incident.incident_type.value
                if hasattr(incident.incident_type, "value")
                else str(incident.incident_type)
            ),
            "severity": (
                incident.severity.value
                if hasattr(incident.severity, "value")
                else str(incident.severity)
            ),
            "root_service_id": str(incident.root_service_id),
        },
    )

    db.commit()
    db.refresh(incident)

    return incident


@router.get(
    "",
    response_model=list[IncidentResponse],
)
def list_incidents(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[Incident]:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    statement = (
        select(Incident)
        .where(
            Incident.user_id == user_id,
        )
        .order_by(
            Incident.created_at.desc(),
        )
    )

    return list(
        db.execute(statement).scalars().all()
    )


@router.get(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def get_incident(
    incident_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> Incident:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    return require_owned_incident(
        incident_id=incident_id,
        user_id=user_id,
        db=db,
    )


@router.patch(
    "/{incident_id}",
    response_model=IncidentResponse,
)
def update_incident(
    incident_id: UUID,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> Incident:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    incident = require_owned_incident(
        incident_id=incident_id,
        user_id=user_id,
        db=db,
    )

    updates = payload.model_dump(
        exclude_unset=True,
    )

    for field, value in updates.items():
        setattr(incident, field, value)

    if (
        payload.status == IncidentStatus.RESOLVED
        and incident.resolved_at is None
    ):
        incident.resolved_at = datetime.now(
            timezone.utc
        )

    elif (
        payload.status is not None
        and payload.status != IncidentStatus.RESOLVED
    ):
        incident.resolved_at = None

    event_type = (
        AuditEventType.INCIDENT_RESOLVED
        if incident.status == IncidentStatus.RESOLVED
        else AuditEventType.INCIDENT_UPDATED
    )

    action = (
        "Resolved incident"
        if incident.status == IncidentStatus.RESOLVED
        else "Updated incident"
    )

    record_audit_event(
        db=db,
        user_id=user_id,
        event_type=event_type,
        entity_type="incident",
        entity_id=incident.id,
        action=action,
        description=f"{action}: {incident.title}.",
        metadata={
            "title": incident.title,
            "status": (
                incident.status.value
                if hasattr(incident.status, "value")
                else str(incident.status)
            ),
            "updated_fields": sorted(updates.keys()),
        },
    )

    db.commit()
    db.refresh(incident)

    return incident


@router.post(
    "/{incident_id}/analyze",
    response_model=IncidentAnalysisResponse,
)
def analyze_incident(
    incident_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> IncidentAnalysisResponse:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    incident = require_owned_incident(
        incident_id=incident_id,
        user_id=user_id,
        db=db,
    )

    incident.status = IncidentStatus.ANALYZING

    try:
        impacts = analyze_and_persist_incident_impacts(
            db=db,
            user_id=user_id,
            incident_id=incident.id,
        )

        record_audit_event(
            db=db,
            user_id=user_id,
            event_type=AuditEventType.IMPACT_ANALYZED,
            entity_type="incident",
            entity_id=incident.id,
            action="Analyzed incident impact",
            description=(
                f"Analyzed dependency impact for: "
                f"{incident.title}."
            ),
            metadata={
                "title": incident.title,
                "affected_service_count": len(impacts),
                "root_service_id": str(
                    incident.root_service_id
                ),
            },
        )

        db.commit()

    except ValueError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    for impact in impacts:
        db.refresh(impact)

    return IncidentAnalysisResponse(
        incident_id=incident.id,
        root_service_id=incident.root_service_id,
        affected_service_count=len(impacts),
        impacts=[
            IncidentImpactResponse.model_validate(
                impact
            )
            for impact in impacts
        ],
    )


@router.get(
    "/{incident_id}/impacts",
    response_model=list[IncidentImpactResponse],
)
def get_incident_impacts(
    incident_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[IncidentImpact]:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    require_owned_incident(
        incident_id=incident_id,
        user_id=user_id,
        db=db,
    )

    statement = (
        select(IncidentImpact)
        .where(
            IncidentImpact.incident_id
            == incident_id,
            IncidentImpact.user_id
            == user_id,
        )
        .order_by(
            IncidentImpact.dependency_depth.asc(),
            IncidentImpact.impact_score.desc(),
        )
    )

    return list(
        db.execute(statement).scalars().all()
    )
