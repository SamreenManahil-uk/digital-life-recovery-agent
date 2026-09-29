from dataclasses import dataclass
from enum import Enum
from uuid import UUID

from app.services.dependency_graph import ImpactedService


class ImpactClassification(str, Enum):
    ROOT = "root"
    DIRECT = "direct"
    INDIRECT = "indirect"


@dataclass(frozen=True)
class RiskAssessment:
    service_id: UUID
    dependency_depth: int
    impact_type: ImpactClassification
    criticality: int
    impact_score: float


def classify_impact(
    dependency_depth: int,
) -> ImpactClassification:
    if dependency_depth == 0:
        return ImpactClassification.ROOT

    if dependency_depth == 1:
        return ImpactClassification.DIRECT

    return ImpactClassification.INDIRECT


def calculate_impact_score(
    dependency_depth: int,
    criticality: int,
) -> float:
    """
    Deterministic impact score from 0 to 100.

    Criticality:
        1 = low importance
        5 = mission critical

    Depth multiplier:
        root      = 1.00
        depth 1   = 0.90
        depth 2   = 0.75
        depth 3   = 0.60
        depth 4   = 0.45
        depth 5+  = 0.30

    Example:
        criticality 5 root:
            100 * 1.00 = 100

        criticality 4 depth 2:
            80 * 0.75 = 60
    """

    if not 1 <= criticality <= 5:
        raise ValueError(
            "criticality must be between 1 and 5"
        )

    base_score = criticality * 20

    depth_multipliers = {
        0: 1.00,
        1: 0.90,
        2: 0.75,
        3: 0.60,
        4: 0.45,
    }

    multiplier = depth_multipliers.get(
        dependency_depth,
        0.30,
    )

    score = base_score * multiplier

    return round(score, 2)


def assess_impacts(
    impacted_services: list[ImpactedService],
    criticalities: dict[UUID, int],
) -> list[RiskAssessment]:
    """
    Convert graph traversal results into deterministic
    risk assessments.

    Every impacted service must have a known criticality.
    """

    assessments: list[RiskAssessment] = []

    for impact in impacted_services:
        if impact.service_id not in criticalities:
            raise ValueError(
                f"Missing criticality for service "
                f"{impact.service_id}"
            )

        criticality = criticalities[impact.service_id]

        assessments.append(
            RiskAssessment(
                service_id=impact.service_id,
                dependency_depth=impact.dependency_depth,
                impact_type=classify_impact(
                    impact.dependency_depth
                ),
                criticality=criticality,
                impact_score=calculate_impact_score(
                    impact.dependency_depth,
                    criticality,
                ),
            )
        )

    return assessments
