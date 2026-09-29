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
from app.models.recovery_method import RecoveryMethod
from app.models.service_account import ServiceAccount
from app.schemas.recovery_method import (
    RecoveryMethodCreate,
    RecoveryMethodResponse,
    RecoveryMethodUpdate,
)


router = APIRouter(
    prefix="/api/v1/recovery-methods",
    tags=["recovery-methods"],
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


def require_owned_recovery_method(
    recovery_method_id: UUID,
    user_id: UUID,
    db: Session,
) -> RecoveryMethod:
    method = db.execute(
        select(RecoveryMethod)
        .join(
            ServiceAccount,
            RecoveryMethod.service_account_id
            == ServiceAccount.id,
        )
        .where(
            RecoveryMethod.id == recovery_method_id,
            ServiceAccount.user_id == user_id,
        )
    ).scalar_one_or_none()

    if method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recovery method not found.",
        )

    return method


@router.post(
    "",
    response_model=RecoveryMethodResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_recovery_method(
    payload: RecoveryMethodCreate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryMethod:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    require_owned_service(
        service_id=payload.service_account_id,
        user_id=user_id,
        db=db,
    )

    method = RecoveryMethod(
        service_account_id=payload.service_account_id,
        method_type=payload.method_type,
        label=payload.label,
        is_available=payload.is_available,
        is_verified=payload.is_verified,
        is_primary=payload.is_primary,
    )

    db.add(method)
    db.commit()
    db.refresh(method)

    return method


@router.get(
    "",
    response_model=list[RecoveryMethodResponse],
)
def list_recovery_methods(
    service_account_id: UUID | None = None,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> list[RecoveryMethod]:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    statement = (
        select(RecoveryMethod)
        .join(
            ServiceAccount,
            RecoveryMethod.service_account_id
            == ServiceAccount.id,
        )
        .where(
            ServiceAccount.user_id == user_id,
        )
    )

    if service_account_id is not None:
        require_owned_service(
            service_id=service_account_id,
            user_id=user_id,
            db=db,
        )

        statement = statement.where(
            RecoveryMethod.service_account_id
            == service_account_id,
        )

    statement = statement.order_by(
        RecoveryMethod.created_at.asc()
    )

    return list(
        db.execute(statement).scalars().all()
    )


@router.get(
    "/{recovery_method_id}",
    response_model=RecoveryMethodResponse,
)
def get_recovery_method(
    recovery_method_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryMethod:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    return require_owned_recovery_method(
        recovery_method_id=recovery_method_id,
        user_id=user_id,
        db=db,
    )


@router.patch(
    "/{recovery_method_id}",
    response_model=RecoveryMethodResponse,
)
def update_recovery_method(
    recovery_method_id: UUID,
    payload: RecoveryMethodUpdate,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> RecoveryMethod:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    method = require_owned_recovery_method(
        recovery_method_id=recovery_method_id,
        user_id=user_id,
        db=db,
    )

    updates = payload.model_dump(
        exclude_unset=True,
    )

    for field, value in updates.items():
        setattr(method, field, value)

    db.commit()
    db.refresh(method)

    return method


@router.delete(
    "/{recovery_method_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_recovery_method(
    recovery_method_id: UUID,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
) -> None:
    require_current_user(
        user_id=user_id,
        db=db,
    )

    method = require_owned_recovery_method(
        recovery_method_id=recovery_method_id,
        user_id=user_id,
        db=db,
    )

    db.delete(method)
    db.commit()
