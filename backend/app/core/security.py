from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)

from app.core.config import settings


password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Argon2.

    Plaintext passwords must never be stored.
    """
    return password_hasher.hash(password)


def verify_password(
    plain_password: str,
    password_hash: str,
) -> bool:
    """
    Verify a plaintext password against an Argon2 hash.
    """
    try:
        return password_hasher.verify(
            password_hash,
            plain_password,
        )
    except (
        VerifyMismatchError,
        VerificationError,
        InvalidHashError,
    ):
        return False


def create_access_token(
    user_id: UUID,
) -> str:
    """
    Create a signed JWT access token.

    The subject claim stores the authenticated user's UUID.
    """
    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": expires_at,
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(
    token: str,
) -> UUID:
    """
    Validate an access token and return its user UUID.

    Raises PyJWT exceptions for invalid or expired tokens
    and ValueError for malformed application claims.
    """
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[
            settings.jwt_algorithm,
        ],
    )

    if payload.get("type") != "access":
        raise ValueError(
            "Invalid token type."
        )

    subject = payload.get("sub")

    if not subject:
        raise ValueError(
            "Token subject is missing."
        )

    try:
        return UUID(subject)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            "Invalid token subject."
        ) from exc
