import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DependencyType(str, Enum):
    TWO_FACTOR_FOR = "two_factor_for"
    LOGIN_IDENTITY_FOR = "login_identity_for"
    RECOVERY_CHANNEL_FOR = "recovery_channel_for"
    CONTROLS = "controls"
    HOSTS = "hosts"
    BILLING_FOR = "billing_for"
    REQUIRED_FOR = "required_for"
    OTHER = "other"


class DependencyRelationship(Base):
    __tablename__ = "dependency_relationships"

    __table_args__ = (
        CheckConstraint(
            "source_service_id <> target_service_id",
            name="ck_dependency_no_self_reference",
        ),
        ForeignKeyConstraint(
            ["user_id", "source_service_id"],
            ["service_accounts.user_id", "service_accounts.id"],
            name="fk_dependency_source_same_user",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["user_id", "target_service_id"],
            ["service_accounts.user_id", "service_accounts.id"],
            name="fk_dependency_target_same_user",
            ondelete="CASCADE",
        ),
        UniqueConstraint(
            "user_id",
            "source_service_id",
            "target_service_id",
            "relationship_type",
            name="uq_dependency_relationship",
        ),
        Index(
            "ix_dependency_source_target",
            "source_service_id",
            "target_service_id",
        ),
        Index(
            "ix_dependency_target_source",
            "target_service_id",
            "source_service_id",
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

    source_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    target_service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    relationship_type: Mapped[DependencyType] = mapped_column(
        SQLEnum(
            DependencyType,
            name="dependency_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    is_critical: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
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

    source_service: Mapped["ServiceAccount"] = relationship(
        foreign_keys=[source_service_id],
        back_populates="outgoing_dependencies",
    )

    target_service: Mapped["ServiceAccount"] = relationship(
        foreign_keys=[target_service_id],
        back_populates="incoming_dependencies",
    )

    user: Mapped["User"] = relationship(
        back_populates="dependency_relationships",
    )
