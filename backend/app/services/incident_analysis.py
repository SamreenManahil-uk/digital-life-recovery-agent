from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_account import ServiceAccount
from app.services.dependency_graph import ImpactedService
from app.services.dependency_graph_loader import load_dependency_graph
from app.services.neo4j_graph_service import get_downstream_impacts
from app.services.risk_engine import RiskAssessment, assess_impacts


def _postgresql_fallback_traversal(
    db: Session,
    user_id: UUID,
    root_service_id: UUID,
) -> list[ImpactedService]:
    """
    Fallback traversal using the PostgreSQL-backed Python graph.

    PostgreSQL remains the source of truth, so incident analysis
    can continue if Neo4j is temporarily unavailable.
    """

    graph = load_dependency_graph(
        db=db,
        user_id=user_id,
    )

    return graph.calculate_cascade(
        root_service_id
    )


def _neo4j_traversal(
    user_id: UUID,
    root_service_id: UUID,
) -> list[ImpactedService]:
    """
    Traverse downstream dependencies using Neo4j.

    Neo4j's downstream query starts at depth 1, therefore the
    incident root is explicitly added at depth 0 so existing
    incident semantics remain unchanged.
    """

    downstream = get_downstream_impacts(
        user_id=user_id,
        root_service_id=root_service_id,
    )

    impacts: list[ImpactedService] = [
        ImpactedService(
            service_id=root_service_id,
            dependency_depth=0,
        )
    ]

    for item in downstream:
        impacts.append(
            ImpactedService(
                service_id=UUID(str(item["id"])),
                dependency_depth=int(
                    item["dependency_depth"]
                ),
            )
        )

    return impacts


def analyze_incident_impact(
    db: Session,
    user_id: UUID,
    root_service_id: UUID,
) -> list[RiskAssessment]:
    """
    Run deterministic cascading-impact analysis.

    Architecture:
        PostgreSQL
            ↓
        ownership / criticality validation

        Neo4j
            ↓
        downstream graph traversal

        deterministic risk engine
            ↓
        RiskAssessment[]

    PostgreSQL/Python traversal is retained as a safe fallback
    if the Neo4j projection is temporarily unavailable.
    """

    # --------------------------------------------------------
    # 1. Security: root must be active and owned by user
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
    # 2. Graph traversal
    # --------------------------------------------------------

    try:
        impacted_services = _neo4j_traversal(
            user_id=user_id,
            root_service_id=root_service_id,
        )

    except Exception as exc:
        print(
            "WARNING: Neo4j incident traversal failed; "
            "using PostgreSQL fallback. "
            f"Reason: {exc}"
        )

        impacted_services = _postgresql_fallback_traversal(
            db=db,
            user_id=user_id,
            root_service_id=root_service_id,
        )

    # --------------------------------------------------------
    # 3. Defensive duplicate handling
    # --------------------------------------------------------

    shortest_depths: dict[UUID, int] = {}

    for impact in impacted_services:
        previous_depth = shortest_depths.get(
            impact.service_id
        )

        if (
            previous_depth is None
            or impact.dependency_depth < previous_depth
        ):
            shortest_depths[
                impact.service_id
            ] = impact.dependency_depth

    impacted_services = [
        ImpactedService(
            service_id=service_id,
            dependency_depth=depth,
        )
        for service_id, depth
        in shortest_depths.items()
    ]

    # --------------------------------------------------------
    # 4. Criticalities from PostgreSQL source of truth
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
    # 5. Cross-store safety check
    # --------------------------------------------------------

    if len(criticalities) != len(impacted_ids):
        raise ValueError(
            "One or more impacted services are missing, inactive, "
            "or outside the user's service graph."
        )

    # --------------------------------------------------------
    # 6. Existing deterministic risk engine
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
