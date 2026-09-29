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
from app.models.service_account import ServiceAccount
from app.services.audit_service import record_audit_event
from app.schemas.service_account import (
    ServiceAccountCreate,
    ServiceAccountResponse,
    ServiceAccountUpdate,
)


router = APIRouter(
    prefix="/api/v1/services",
    tags=["services"],
)


@router.post(
    "",
    response_model=ServiceAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_service(
    payload: ServiceAccountCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> ServiceAccount:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    service = ServiceAccount(
        user_id=user_id,
        name=payload.name,
        provider=payload.provider,
        service_type=payload.service_type,
        criticality=payload.criticality,
        description=payload.description,
        is_active=True,
    )

    db.add(service)
    db.flush()

    record_audit_event(
        db=db,
        user_id=user_id,
        event_type=AuditEventType.SERVICE_CREATED,
        entity_type="service",
        entity_id=service.id,
        action="Created digital asset",
        description=f"Created digital asset: {service.name}.",
        metadata={
            "service_name": service.name,
            "provider": service.provider,
            "criticality": service.criticality,
        },
    )

    db.commit()
    db.refresh(service)

    return service


@router.get(
    "",
    response_model=list[ServiceAccountResponse],
)
def list_services(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[ServiceAccount]:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    statement = (
        select(ServiceAccount)
        .where(
            ServiceAccount.user_id == user_id,
        )
        .order_by(
            ServiceAccount.created_at.desc(),
        )
    )

    return list(
        db.execute(statement).scalars().all()
    )


@router.get(
    "/{service_id}",
    response_model=ServiceAccountResponse,
)
def get_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> ServiceAccount:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    service = db.execute(
        select(ServiceAccount).where(
            ServiceAccount.id == service_id,
            ServiceAccount.user_id == user_id,
        )
    ).scalar_one_or_none()

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    return service


@router.patch(
    "/{service_id}",
    response_model=ServiceAccountResponse,
)
def update_service(
    service_id: UUID,
    payload: ServiceAccountUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> ServiceAccount:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    service = db.execute(
        select(ServiceAccount).where(
            ServiceAccount.id == service_id,
            ServiceAccount.user_id == user_id,
        )
    ).scalar_one_or_none()

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    updates = payload.model_dump(
        exclude_unset=True,
    )

    for field, value in updates.items():
        setattr(service, field, value)

    record_audit_event(
        db=db,
        user_id=user_id,
        event_type=AuditEventType.SERVICE_UPDATED,
        entity_type="service",
        entity_id=service.id,
        action="Updated digital asset",
        description=f"Updated digital asset: {service.name}.",
        metadata={
            "service_name": service.name,
            "updated_fields": sorted(updates.keys()),
        },
    )

    db.commit()
    db.refresh(service)

    return service


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_service(
    service_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    service = db.execute(
        select(ServiceAccount).where(
            ServiceAccount.id == service_id,
            ServiceAccount.user_id == user_id,
        )
    ).scalar_one_or_none()

    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    service_id_for_audit = service.id
    service_name_for_audit = service.name

    db.delete(service)

    record_audit_event(
        db=db,
        user_id=user_id,
        event_type=AuditEventType.SERVICE_DELETED,
        entity_type="service",
        entity_id=service_id_for_audit,
        action="Deleted digital asset",
        description=(
            f"Deleted digital asset: {service_name_for_audit}."
        ),
        metadata={
            "service_name": service_name_for_audit,
        },
    )

    db.commit()
