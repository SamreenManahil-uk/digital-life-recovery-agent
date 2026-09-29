import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ServiceType(str, Enum):
    EMAIL = "email"
    DEVICE = "device"
    SOCIAL = "social"
    DEVELOPER = "developer"
    CLOUD = "cloud"
    FINANCIAL = "financial"
    STORAGE = "storage"
    COMMUNICATION = "communication"
    OTHER = "other"


class ServiceAccount(Base):
    __tablename__ = "service_accounts"

    __table_args__ = (
        Index("ix_service_accounts_user_type", "user_id", "service_type"),
        UniqueConstraint(
            "user_id",
            "id",
            name="uq_service_accounts_user_id_id",
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

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    provider: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    service_type: Mapped[ServiceType] = mapped_column(
        SQLEnum(
            ServiceType,
            name="service_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    criticality: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
        default=3,
        server_default="3",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
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
        back_populates="service_accounts",
    )

    recovery_methods: Mapped[list["RecoveryMethod"]] = relationship(
        back_populates="service_account",
        cascade="all, delete-orphan",
    )

    outgoing_dependencies: Mapped[list["DependencyRelationship"]] = relationship(
        foreign_keys="DependencyRelationship.source_service_id",
        back_populates="source_service",
        cascade="all, delete-orphan",
    )

    incoming_dependencies: Mapped[list["DependencyRelationship"]] = relationship(
        foreign_keys="DependencyRelationship.target_service_id",
        back_populates="target_service",
        cascade="all, delete-orphan",
    )

    incidents: Mapped[list["Incident"]] = relationship(
        back_populates="root_service",
        primaryjoin=(
            "and_("
            "ServiceAccount.user_id == Incident.user_id, "
            "ServiceAccount.id == Incident.root_service_id"
            ")"
        ),
        foreign_keys="[Incident.root_service_id]",
    )

    recovery_actions: Mapped[list["RecoveryAction"]] = relationship(
        back_populates="service_account",
        primaryjoin=(
            "and_("
            "ServiceAccount.user_id == RecoveryAction.user_id, "
            "ServiceAccount.id == RecoveryAction.service_account_id"
            ")"
        ),
        foreign_keys="[RecoveryAction.service_account_id]",
    )

    incident_impacts: Mapped[list["IncidentImpact"]] = relationship(
        back_populates="service_account",
        primaryjoin=(
            "and_("
            "ServiceAccount.user_id == IncidentImpact.user_id, "
            "ServiceAccount.id == IncidentImpact.service_account_id"
            ")"
        ),
        foreign_keys="[IncidentImpact.service_account_id]",
    )
