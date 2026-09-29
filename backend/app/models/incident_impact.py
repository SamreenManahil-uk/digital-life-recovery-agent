import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ImpactType(str, Enum):
    ROOT = "root"
    DIRECT = "direct"
    INDIRECT = "indirect"


class IncidentImpact(Base):
    __tablename__ = "incident_impacts"

    __table_args__ = (
        ForeignKeyConstraint(
            ["user_id", "incident_id"],
            ["incidents.user_id", "incidents.id"],
            name="fk_incident_impact_incident_same_user",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["user_id", "service_account_id"],
            ["service_accounts.user_id", "service_accounts.id"],
            name="fk_incident_impact_service_same_user",
            ondelete="RESTRICT",
        ),
        UniqueConstraint(
            "incident_id",
            "service_account_id",
            name="uq_incident_impact_service",
        ),
        Index(
            "ix_incident_impacts_user_incident",
            "user_id",
            "incident_id",
        ),
        Index(
            "ix_incident_impacts_incident_depth",
            "incident_id",
            "dependency_depth",
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

    service_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    impact_type: Mapped[ImpactType] = mapped_column(
        SQLEnum(
            ImpactType,
            name="impact_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    dependency_depth: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    impact_score: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    is_access_blocked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    explanation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    incident: Mapped["Incident"] = relationship(
        back_populates="impacts",
        primaryjoin=(
            "and_("
            "IncidentImpact.user_id == Incident.user_id, "
            "IncidentImpact.incident_id == Incident.id"
            ")"
        ),
        foreign_keys="[IncidentImpact.incident_id]",
    )

    service_account: Mapped["ServiceAccount"] = relationship(
        back_populates="incident_impacts",
        primaryjoin=(
            "and_("
            "IncidentImpact.user_id == ServiceAccount.user_id, "
            "IncidentImpact.service_account_id == ServiceAccount.id"
            ")"
        ),
        foreign_keys="[IncidentImpact.service_account_id]",
    )
