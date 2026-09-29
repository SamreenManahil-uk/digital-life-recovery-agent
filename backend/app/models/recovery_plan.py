import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecoveryPlanStatus(str, Enum):
    DRAFT = "draft"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class RecoveryPlan(Base):
    __tablename__ = "recovery_plans"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "id",
            name="uq_recovery_plans_user_id_id",
        ),
        ForeignKeyConstraint(
            ["user_id", "incident_id"],
            ["incidents.user_id", "incidents.id"],
            name="fk_recovery_plan_incident_same_user",
            ondelete="CASCADE",
        ),
        Index(
            "ix_recovery_plans_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_recovery_plans_incident_created",
            "incident_id",
            "created_at",
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

    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    status: Mapped[RecoveryPlanStatus] = mapped_column(
        SQLEnum(
            RecoveryPlanStatus,
            name="recovery_plan_status_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
        default=RecoveryPlanStatus.DRAFT,
        server_default="draft",
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
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

    incident: Mapped["Incident"] = relationship(
        back_populates="recovery_plans",
        primaryjoin=(
            "and_("
            "RecoveryPlan.user_id == Incident.user_id, "
            "RecoveryPlan.incident_id == Incident.id"
            ")"
        ),
        foreign_keys="[RecoveryPlan.incident_id]",
    )

    actions: Mapped[list["RecoveryAction"]] = relationship(
        back_populates="recovery_plan",
        cascade="all, delete-orphan",
        order_by="RecoveryAction.step_order",
        primaryjoin=(
            "and_("
            "RecoveryPlan.user_id == RecoveryAction.user_id, "
            "RecoveryPlan.id == RecoveryAction.recovery_plan_id"
            ")"
        ),
        foreign_keys="[RecoveryAction.recovery_plan_id]",
    )
