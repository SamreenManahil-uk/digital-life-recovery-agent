from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.incident_impact import (
    ImpactType,
    IncidentImpact,
)
from app.services.recovery_intelligence import (
    AccessRiskState,
    build_recovery_intelligence,
)


def analyze_and_persist_incident_impacts(
    db: Session,
    user_id: UUID,
    incident_id: UUID,
) -> list[IncidentImpact]:
    """
    Analyze an incident using the deterministic recovery
    intelligence pipeline and persist its impact snapshot.

    Safe to re-run:
    existing impact rows for this incident are replaced
    by a newly calculated snapshot.
    """

    statement = (
        select(Incident)
        .where(
            Incident.id == incident_id,
            Incident.user_id == user_id,
        )
    )

    incident = db.execute(
        statement
    ).scalar_one_or_none()

    if incident is None:
        raise ValueError(
            "Incident does not exist or does not belong "
            "to this user."
        )

    intelligence_results = build_recovery_intelligence(
        db=db,
        user_id=user_id,
        root_service_id=incident.root_service_id,
    )

    # Replace previous deterministic snapshot.
    db.execute(
        delete(IncidentImpact).where(
            IncidentImpact.incident_id == incident_id,
            IncidentImpact.user_id == user_id,
        )
    )

    persisted_impacts: list[IncidentImpact] = []

    for result in intelligence_results:
        is_blocked = (
            result.access_risk_state
            == AccessRiskState.BLOCKED
        )

        explanation = (
            f"{result.impact_type.capitalize()} impact at "
            f"dependency depth {result.dependency_depth}. "
            f"Impact score: {result.impact_score:.2f}. "
            f"Recovery readiness: "
            f"{result.readiness_level.value} "
            f"({result.readiness_score:.2f}/100). "
            f"Access risk state: "
            f"{result.access_risk_state.value}."
        )

        impact = IncidentImpact(
            user_id=user_id,
            incident_id=incident_id,
            service_account_id=result.service_id,
            impact_type=ImpactType(
                result.impact_type
            ),
            dependency_depth=result.dependency_depth,
            impact_score=result.impact_score,
            is_access_blocked=is_blocked,
            explanation=explanation,
        )

        db.add(impact)
        persisted_impacts.append(impact)

    db.flush()

    return persisted_impacts
