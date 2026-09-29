import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
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


class IncidentType(str, Enum):
    ACCESS_LOST = "access_lost"
    DEVICE_LOST = "device_lost"
    COMPROMISED = "compromised"
    CREDENTIAL_FAILURE = "credential_failure"
    RECOVERY_FAILURE = "recovery_failure"
    SERVICE_UNAVAILABLE = "service_unavailable"
    OTHER = "other"


class IncidentStatus(str, Enum):
    OPEN = "open"
    ANALYZING = "analyzing"
    RECOVERING = "recovering"
    RESOLVED = "resolved"


class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Incident(Base):
    __tablename__ = "incidents"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "id",
            name="uq_incidents_user_id_id",
        ),
        ForeignKeyConstraint(
            ["user_id", "root_service_id"],
            ["service_accounts.user_id", "service_accounts.id"],
            name="fk_incident_root_service_same_user",
            ondelete="RESTRICT",
        ),
        Index(
            "ix_incidents_user_status",
            "user_id",
            "status",
        ),
        Index(
            "ix_incidents_user_created_at",
            "user_id",
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
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    root_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    incident_type: Mapped[IncidentType] = mapped_column(
        SQLEnum(
            IncidentType,
            name="incident_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    status: Mapped[IncidentStatus] = mapped_column(
        SQLEnum(
            IncidentStatus,
            name="incident_status_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
        default=IncidentStatus.OPEN,
        server_default="open",
    )

    severity: Mapped[IncidentSeverity] = mapped_column(
        SQLEnum(
            IncidentSeverity,
            name="incident_severity_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
        default=IncidentSeverity.MEDIUM,
        server_default="medium",
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
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

    user: Mapped["User"] = relationship(
        back_populates="incidents",
    )

    root_service: Mapped["ServiceAccount"] = relationship(
        back_populates="incidents",
        primaryjoin=(
            "and_("
            "Incident.user_id == ServiceAccount.user_id, "
            "Incident.root_service_id == ServiceAccount.id"
            ")"
        ),
        foreign_keys="[Incident.root_service_id]",
    )

    recovery_plans: Mapped[list["RecoveryPlan"]] = relationship(
        back_populates="incident",
        cascade="all, delete-orphan",
        primaryjoin=(
            "and_("
            "Incident.user_id == RecoveryPlan.user_id, "
            "Incident.id == RecoveryPlan.incident_id"
            ")"
        ),
        foreign_keys="[RecoveryPlan.incident_id]",
    )

    impacts: Mapped[list["IncidentImpact"]] = relationship(
        back_populates="incident",
        cascade="all, delete-orphan",
        primaryjoin=(
            "and_("
            "Incident.user_id == IncidentImpact.user_id, "
            "Incident.id == IncidentImpact.incident_id"
            ")"
        ),
        foreign_keys="[IncidentImpact.incident_id]",
    )
