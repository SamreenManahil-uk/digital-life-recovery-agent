from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent, AuditEventType


def record_audit_event(
    *,
    db: Session,
    user_id: UUID,
    event_type: AuditEventType,
    entity_type: str,
    action: str,
    entity_id: UUID | None = None,
    description: str | None = None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditEvent:
    """
    Add an audit event to the current database transaction.

    This function deliberately does NOT commit. The calling route/service
    controls the transaction so the business change and its audit event
    succeed or fail together.
    """

    event = AuditEvent(
        user_id=user_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        description=description,
        event_metadata=metadata,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(event)

    return event
