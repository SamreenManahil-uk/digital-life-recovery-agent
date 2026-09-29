from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dependency_relationship import DependencyRelationship
from app.services.dependency_graph import DependencyEdge, DependencyGraph


def load_dependency_graph(
    db: Session,
    user_id: UUID,
) -> DependencyGraph:
    """
    Load one user's dependency graph from PostgreSQL.

    Security rule:
    Only dependency relationships belonging to the supplied
    user_id are loaded into the graph.
    """

    statement = (
        select(
            DependencyRelationship.source_service_id,
            DependencyRelationship.target_service_id,
        )
        .where(
            DependencyRelationship.user_id == user_id
        )
    )

    rows = db.execute(statement).all()

    edges = [
        DependencyEdge(
            source_service_id=row.source_service_id,
            target_service_id=row.target_service_id,
        )
        for row in rows
    ]

    return DependencyGraph(edges)
