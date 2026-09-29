from dataclasses import dataclass
from enum import Enum
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_method import RecoveryMethod
from app.models.service_account import ServiceAccount


class RecoveryReadinessLevel(str, Enum):
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    NONE = "none"


@dataclass(frozen=True)
class RecoveryReadiness:
    service_id: UUID
    level: RecoveryReadinessLevel
    total_methods: int
    available_methods: int
    verified_available_methods: int
    has_primary_verified_method: bool
    readiness_score: float


def calculate_readiness_score(
    available_methods: int,
    verified_available_methods: int,
    has_primary_verified_method: bool,
) -> float:
    """
    Deterministic recovery-readiness score from 0 to 100.

    Scoring:
        available method        = 10 points each
        verified available      = 25 additional points each
        verified primary method = 15 bonus points

    Score is capped at 100.
    """

    if available_methods < 0:
        raise ValueError(
            "available_methods cannot be negative"
        )

    if verified_available_methods < 0:
        raise ValueError(
            "verified_available_methods cannot be negative"
        )

    if verified_available_methods > available_methods:
        raise ValueError(
            "verified available methods cannot exceed "
            "available methods"
        )

    score = (
        available_methods * 10
        + verified_available_methods * 25
    )

    if has_primary_verified_method:
        score += 15

    return float(min(score, 100))


def classify_readiness(
    available_methods: int,
    verified_available_methods: int,
) -> RecoveryReadinessLevel:
    if available_methods == 0:
        return RecoveryReadinessLevel.NONE

    if verified_available_methods == 0:
        return RecoveryReadinessLevel.WEAK

    if verified_available_methods == 1:
        return RecoveryReadinessLevel.MODERATE

    return RecoveryReadinessLevel.STRONG


def assess_service_recovery_readiness(
    db: Session,
    user_id: UUID,
    service_id: UUID,
) -> RecoveryReadiness:
    """
    Assess recovery readiness for one service.

    Security:
    The service must belong to the supplied user.
    """

    service_statement = (
        select(ServiceAccount.id)
        .where(
            ServiceAccount.id == service_id,
            ServiceAccount.user_id == user_id,
            ServiceAccount.is_active.is_(True),
        )
    )

    service = db.execute(
        service_statement
    ).scalar_one_or_none()

    if service is None:
        raise ValueError(
            "Service does not exist, is inactive, "
            "or does not belong to this user."
        )

    methods_statement = (
        select(RecoveryMethod)
        .where(
            RecoveryMethod.service_account_id
            == service_id
        )
    )

    methods = db.execute(
        methods_statement
    ).scalars().all()

    available = [
        method
        for method in methods
        if method.is_available
    ]

    verified_available = [
        method
        for method in available
        if method.is_verified
    ]

    has_primary_verified = any(
        method.is_primary
        and method.is_verified
        and method.is_available
        for method in methods
    )

    level = classify_readiness(
        available_methods=len(available),
        verified_available_methods=len(
            verified_available
        ),
    )

    score = calculate_readiness_score(
        available_methods=len(available),
        verified_available_methods=len(
            verified_available
        ),
        has_primary_verified_method=(
            has_primary_verified
        ),
    )

    return RecoveryReadiness(
        service_id=service_id,
        level=level,
        total_methods=len(methods),
        available_methods=len(available),
        verified_available_methods=len(
            verified_available
        ),
        has_primary_verified_method=(
            has_primary_verified
        ),
        readiness_score=score,
    )
