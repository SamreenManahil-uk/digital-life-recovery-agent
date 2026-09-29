from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_account import ServiceAccount
from app.services.dependency_graph_loader import load_dependency_graph
from app.services.risk_engine import RiskAssessment, assess_impacts


def analyze_incident_impact(
    db: Session,
    user_id: UUID,
    root_service_id: UUID,
) -> list[RiskAssessment]:
    """
    Run deterministic cascading-impact analysis for one incident.

    Pipeline:
        PostgreSQL dependencies
            ↓
        user-scoped dependency graph
            ↓
        downstream cascade traversal
            ↓
        service criticalities
            ↓
        deterministic risk assessments
    """

    # --------------------------------------------------------
    # Security: root service must belong to this user
    # --------------------------------------------------------

    root_statement = (
        select(ServiceAccount.id)
        .where(
            ServiceAccount.id == root_service_id,
            ServiceAccount.user_id == user_id,
            ServiceAccount.is_active.is_(True),
        )
    )

    root_service = db.execute(
        root_statement
    ).scalar_one_or_none()

    if root_service is None:
        raise ValueError(
            "Root service does not exist, is inactive, "
            "or does not belong to this user."
        )


    # --------------------------------------------------------
    # Load user-scoped graph
    # --------------------------------------------------------

    graph = load_dependency_graph(
        db=db,
        user_id=user_id,
    )

    impacted_services = graph.calculate_cascade(
        root_service_id
    )


    # --------------------------------------------------------
    # Load criticalities ONLY for impacted services
    # --------------------------------------------------------

    impacted_ids = [
        impact.service_id
        for impact in impacted_services
    ]

    criticality_statement = (
        select(
            ServiceAccount.id,
            ServiceAccount.criticality,
        )
        .where(
            ServiceAccount.user_id == user_id,
            ServiceAccount.id.in_(impacted_ids),
            ServiceAccount.is_active.is_(True),
        )
    )

    rows = db.execute(
        criticality_statement
    ).all()

    criticalities = {
        row.id: row.criticality
        for row in rows
    }


    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if len(criticalities) != len(impacted_ids):
        raise ValueError(
            "One or more impacted services are missing, inactive, "
            "or outside the user's service graph."
        )


    # --------------------------------------------------------
    # Deterministic risk analysis
    # --------------------------------------------------------

    assessments = assess_impacts(
        impacted_services=impacted_services,
        criticalities=criticalities,
    )

    return sorted(
        assessments,
        key=lambda assessment: (
            assessment.dependency_depth,
            -assessment.impact_score,
        ),
    )
