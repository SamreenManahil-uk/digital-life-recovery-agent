import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecoveryActionStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"
    FAILED = "failed"


class RecoveryActionType(str, Enum):
    RESTORE_ACCESS = "restore_access"
    VERIFY_RECOVERY_METHOD = "verify_recovery_method"
    RESET_CREDENTIAL = "reset_credential"
    RECONFIGURE_2FA = "reconfigure_2fa"
    VERIFY_DEPENDENCY = "verify_dependency"
    CONTACT_SUPPORT = "contact_support"
    SECURITY_REVIEW = "security_review"
    OTHER = "other"


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "recovery_plan_id"],
            ["recovery_plans.user_id", "recovery_plans.id"],
            name="fk_recovery_action_plan_same_user",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["user_id", "service_account_id"],
            ["service_accounts.user_id", "service_accounts.id"],
            name="fk_recovery_action_service_same_user",
            ondelete="RESTRICT",
        ),
        UniqueConstraint(
            "recovery_plan_id",
            "step_order",
            name="uq_recovery_action_plan_step",
        ),
        Index(
            "ix_recovery_actions_plan_status",
            "recovery_plan_id",
            "status",
        ),
        Index(
            "ix_recovery_actions_user_service",
            "user_id",
            "service_account_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    recovery_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    service_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    step_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    action_type: Mapped[RecoveryActionType] = mapped_column(
        SQLEnum(
            RecoveryActionType,
            name="recovery_action_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    status: Mapped[RecoveryActionStatus] = mapped_column(
        SQLEnum(
            RecoveryActionStatus,
            name="recovery_action_status_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
        default=RecoveryActionStatus.PENDING,
        server_default="pending",
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    instructions: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    blocking_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    recovery_plan: Mapped["RecoveryPlan"] = relationship(
        back_populates="actions",
        primaryjoin=(
            "and_("
            "RecoveryAction.user_id == RecoveryPlan.user_id, "
            "RecoveryAction.recovery_plan_id == RecoveryPlan.id"
            ")"
        ),
        foreign_keys="[RecoveryAction.recovery_plan_id]",
    )

    service_account: Mapped["ServiceAccount"] = relationship(
        back_populates="recovery_actions",
        primaryjoin=(
            "and_("
            "RecoveryAction.user_id == ServiceAccount.user_id, "
            "RecoveryAction.service_account_id == ServiceAccount.id"
            ")"
        ),
        foreign_keys="[RecoveryAction.service_account_id]",
    )
