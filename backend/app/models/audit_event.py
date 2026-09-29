import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditEventType(str, Enum):
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"

    SERVICE_CREATED = "service_created"
    SERVICE_UPDATED = "service_updated"
    SERVICE_DELETED = "service_deleted"

    DEPENDENCY_CREATED = "dependency_created"
    DEPENDENCY_DELETED = "dependency_deleted"

    INCIDENT_CREATED = "incident_created"
    INCIDENT_UPDATED = "incident_updated"
    INCIDENT_RESOLVED = "incident_resolved"

    IMPACT_ANALYZED = "impact_analyzed"

    RECOVERY_PLAN_CREATED = "recovery_plan_created"
    RECOVERY_PLAN_UPDATED = "recovery_plan_updated"

    RECOVERY_ACTION_STARTED = "recovery_action_started"
    RECOVERY_ACTION_COMPLETED = "recovery_action_completed"
    RECOVERY_ACTION_FAILED = "recovery_action_failed"

    SECURITY_EVENT = "security_event"
    OTHER = "other"


class AuditEvent(Base):
    __tablename__ = "audit_events"

    __table_args__ = (
        Index(
            "ix_audit_events_user_created",
            "user_id",
            "created_at",
        ),
        Index(
            "ix_audit_events_user_event_type",
            "user_id",
            "event_type",
        ),
        Index(
            "ix_audit_events_entity",
            "entity_type",
            "entity_id",
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

    event_type: Mapped[AuditEventType] = mapped_column(
        SQLEnum(
            AuditEventType,
            name="audit_event_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    entity_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    event_metadata: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    user_agent: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
