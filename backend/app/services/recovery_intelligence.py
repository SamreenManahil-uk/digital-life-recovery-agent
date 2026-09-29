from dataclasses import dataclass
from enum import Enum
from uuid import UUID

from sqlalchemy.orm import Session

from app.services.incident_analysis import (
    analyze_incident_impact,
)
from app.services.recovery_readiness import (
    RecoveryReadiness,
    RecoveryReadinessLevel,
    assess_service_recovery_readiness,
)
from app.services.risk_engine import RiskAssessment


class AccessRiskState(str, Enum):
    BLOCKED = "blocked"
    HIGH_RISK = "high_risk"
    RECOVERABLE = "recoverable"
    RESILIENT = "resilient"


@dataclass(frozen=True)
class RecoveryIntelligence:
    service_id: UUID
    dependency_depth: int
    impact_type: str
    criticality: int
    impact_score: float
    readiness_level: RecoveryReadinessLevel
    readiness_score: float
    available_recovery_methods: int
    verified_recovery_methods: int
    access_risk_state: AccessRiskState
    is_access_blocked: bool


def determine_access_risk_state(
    impact: RiskAssessment,
    readiness: RecoveryReadiness,
) -> AccessRiskState:
    """
    Deterministic access-risk classification.
    """

    if impact.dependency_depth == 0:
        return AccessRiskState.BLOCKED

    if readiness.level in {
        RecoveryReadinessLevel.NONE,
        RecoveryReadinessLevel.WEAK,
    }:
        return AccessRiskState.HIGH_RISK

    if (
        readiness.level
        == RecoveryReadinessLevel.MODERATE
    ):
        return AccessRiskState.RECOVERABLE

    return AccessRiskState.RESILIENT


def build_recovery_intelligence(
    db: Session,
    user_id: UUID,
    root_service_id: UUID,
) -> list[RecoveryIntelligence]:
    """
    Combine dependency impact analysis with
    recovery readiness.

    This layer is fully deterministic.
    """

    impacts = analyze_incident_impact(
        db=db,
        user_id=user_id,
        root_service_id=root_service_id,
    )

    results: list[RecoveryIntelligence] = []

    for impact in impacts:
        readiness = assess_service_recovery_readiness(
            db=db,
            user_id=user_id,
            service_id=impact.service_id,
        )

        access_state = determine_access_risk_state(
            impact=impact,
            readiness=readiness,
        )

        results.append(
            RecoveryIntelligence(
                service_id=impact.service_id,
                dependency_depth=(
                    impact.dependency_depth
                ),
                impact_type=(
                    impact.impact_type.value
                ),
                criticality=impact.criticality,
                impact_score=impact.impact_score,
                readiness_level=readiness.level,
                readiness_score=(
                    readiness.readiness_score
                ),
                available_recovery_methods=(
                    readiness.available_methods
                ),
                verified_recovery_methods=(
                    readiness.verified_available_methods
                ),
                access_risk_state=access_state,
                is_access_blocked=(
                    access_state
                    == AccessRiskState.BLOCKED
                ),
            )
        )

    return results
