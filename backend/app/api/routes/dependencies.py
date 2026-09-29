from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user_id,
    get_db,
    require_current_user,
)
from app.models.audit_event import AuditEventType
from app.models.dependency_relationship import (
    DependencyRelationship,
)
from app.models.service_account import ServiceAccount
from app.schemas.dependency_relationship import (
    DependencyRelationshipCreate,
    DependencyRelationshipResponse,
)
from app.services.audit_service import record_audit_event


router = APIRouter(
    prefix="/api/v1/dependencies",
    tags=["dependencies"],
)


def require_owned_service(
    service_id: UUID,
    user_id: UUID,
    db: Session,
) -> ServiceAccount:
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

    return service


@router.post(
    "",
    response_model=DependencyRelationshipResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_dependency(
    payload: DependencyRelationshipCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> DependencyRelationship:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    if payload.source_service_id == payload.target_service_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A service cannot depend on itself."
            ),
        )

    require_owned_service(
        service_id=payload.source_service_id,
        user_id=user_id,
        db=db,
    )

    require_owned_service(
        service_id=payload.target_service_id,
        user_id=user_id,
        db=db,
    )

    dependency = DependencyRelationship(
        user_id=user_id,
        source_service_id=payload.source_service_id,
        target_service_id=payload.target_service_id,
        relationship_type=payload.relationship_type,
        is_critical=payload.is_critical,
        notes=payload.notes,
    )

    db.add(dependency)

    try:
        db.flush()

        record_audit_event(
            db=db,
            user_id=user_id,
            event_type=AuditEventType.DEPENDENCY_CREATED,
            entity_type="dependency",
            entity_id=dependency.id,
            action="Created dependency",
            description="Created a digital dependency relationship.",
            metadata={
                "source_service_id": str(
                    dependency.source_service_id
                ),
                "target_service_id": str(
                    dependency.target_service_id
                ),
                "relationship_type": (
                    dependency.relationship_type.value
                    if hasattr(
                        dependency.relationship_type,
                        "value",
                    )
                    else str(dependency.relationship_type)
                ),
                "is_critical": dependency.is_critical,
            },
        )

        db.commit()

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This dependency relationship "
                "already exists."
            ),
        ) from exc

    db.refresh(dependency)

    return dependency


@router.get(
    "",
    response_model=list[
        DependencyRelationshipResponse
    ],
)
def list_dependencies(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[DependencyRelationship]:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    statement = (
        select(DependencyRelationship)
        .where(
            DependencyRelationship.user_id
            == user_id
        )
        .order_by(
            DependencyRelationship.created_at.asc()
        )
    )

    return list(
        db.execute(statement).scalars().all()
    )


@router.get(
    "/{dependency_id}",
    response_model=DependencyRelationshipResponse,
)
def get_dependency(
    dependency_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> DependencyRelationship:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    dependency = db.execute(
        select(DependencyRelationship).where(
            DependencyRelationship.id
            == dependency_id,
            DependencyRelationship.user_id
            == user_id,
        )
    ).scalar_one_or_none()

    if dependency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found.",
        )

    return dependency


@router.delete(
    "/{dependency_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_dependency(
    dependency_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    dependency = db.execute(
        select(DependencyRelationship).where(
            DependencyRelationship.id
            == dependency_id,
            DependencyRelationship.user_id
            == user_id,
        )
    ).scalar_one_or_none()

    if dependency is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found.",
        )

    dependency_id_for_audit = dependency.id
    source_id_for_audit = dependency.source_service_id
    target_id_for_audit = dependency.target_service_id

    db.delete(dependency)

    record_audit_event(
        db=db,
        user_id=user_id,
        event_type=AuditEventType.DEPENDENCY_DELETED,
        entity_type="dependency",
        entity_id=dependency_id_for_audit,
        action="Deleted dependency",
        description="Deleted a digital dependency relationship.",
        metadata={
            "source_service_id": str(source_id_for_audit),
            "target_service_id": str(target_id_for_audit),
        },
    )

    db.commit()
