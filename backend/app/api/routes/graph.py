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
from app.models.service_account import ServiceAccount
from app.services.neo4j_graph_service import (
    get_downstream_impacts,
    get_single_points_of_failure,
    get_user_graph,
    sync_user_graph,
)


router = APIRouter(
    prefix="/api/v1/graph",
    tags=["graph intelligence"],
)


@router.post("/sync")
def sync_graph(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """
    Synchronise the authenticated user's PostgreSQL
    dependency data into Neo4j.
    """

    require_current_user(
        user_id=user_id,
        db=db,
    )

    result = sync_user_graph(
        db=db,
        user_id=user_id,
    )

    return {
        "status": "synced",
        **result,
    }


@router.get("")
def read_graph(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """
    Return the authenticated user's Neo4j graph.
    """

    require_current_user(
        user_id=user_id,
        db=db,
    )

    return get_user_graph(user_id)


@router.get("/impact/{service_id}")
def read_downstream_impact(
    service_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """
    Use Cypher traversal to find services affected by
    failure of one authenticated-user-owned asset.
    """

    require_current_user(
        user_id=user_id,
        db=db,
    )

    service = db.execute(
        select(ServiceAccount).where(
            ServiceAccount.id == service_id,
            ServiceAccount.user_id == user_id,
            ServiceAccount.is_active.is_(True),
        )
    ).scalar_one_or_none()

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    impacts = get_downstream_impacts(
        user_id=user_id,
        root_service_id=service_id,
    )

    return {
        "root_service_id": str(service.id),
        "root_service_name": service.name,
        "affected_service_count": len(impacts),
        "impacts": impacts,
    }


@router.get("/single-points-of-failure")
def read_single_points_of_failure(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> dict:
    """
    Return graph nodes with downstream blast radius.
    """

    require_current_user(
        user_id=user_id,
        db=db,
    )

    points = get_single_points_of_failure(user_id)

    return {
        "count": len(points),
        "items": points,
    }
