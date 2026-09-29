import jwt
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import (
    authentication_error,
    bearer_scheme,
    get_db,
    require_current_user,
)
from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


def normalize_email(
    email: str,
) -> str:
    return email.strip().lower()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    email = normalize_email(
        str(payload.email)
    )

    existing_user = db.execute(
        select(User).where(
            func.lower(User.email) == email
        )
    ).scalar_one_or_none()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    user = User(
        email=email,
        password_hash=hash_password(
            payload.password
        ),
        display_name=payload.display_name.strip(),
        is_active=True,
    )

    db.add(user)

    try:
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An account with this email "
                "already exists."
            ),
        ) from exc

    db.refresh(user)

    access_token = create_access_token(
        user.id
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=(
            settings.access_token_expire_minutes
            * 60
        ),
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    email = normalize_email(
        str(payload.email)
    )

    user = db.execute(
        select(User).where(
            func.lower(User.email) == email
        )
    ).scalar_one_or_none()

    if (
        user is None
        or not verify_password(
            payload.password,
            user.password_hash
            if user is not None
            else "",
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
        )

    access_token = create_access_token(
        user.id
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=(
            settings.access_token_expire_minutes
            * 60
        ),
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    credentials: (
        HTTPAuthorizationCredentials | None
    ) = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Return the currently authenticated active user.
    """
    if credentials is None:
        raise authentication_error()

    if credentials.scheme.lower() != "bearer":
        raise authentication_error()

    try:
        user_id = decode_access_token(
            credentials.credentials
        )

    except (
        jwt.InvalidTokenError,
        ValueError,
    ) as exc:
        raise authentication_error() from exc

    user = require_current_user(
        user_id=user_id,
        db=db,
    )

    return UserResponse.model_validate(user)
