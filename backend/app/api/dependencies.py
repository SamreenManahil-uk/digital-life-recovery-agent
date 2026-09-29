from collections.abc import Generator
from uuid import UUID

import jwt
from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Provide a database session for a single request.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def authentication_error() -> HTTPException:
    """
    Return a consistent authentication error.

    Avoid exposing token validation internals.
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


def get_current_user_id(
    credentials: (
        HTTPAuthorizationCredentials | None
    ) = Depends(bearer_scheme),
) -> UUID:
    """
    Authenticate the request using a Bearer JWT and
    return the authenticated user's UUID.
    """
    if credentials is None:
        raise authentication_error()

    if credentials.scheme.lower() != "bearer":
        raise authentication_error()

    try:
        return decode_access_token(
            credentials.credentials
        )

    except (
        jwt.InvalidTokenError,
        ValueError,
    ) as exc:
        raise authentication_error() from exc


def require_current_user(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    """
    Verify that the authenticated JWT subject belongs
    to an active user.
    """
    user = db.execute(
        select(User).where(
            User.id == user_id,
            User.is_active.is_(True),
        )
    ).scalar_one_or_none()

    if user is None:
        raise authentication_error()

    return user
