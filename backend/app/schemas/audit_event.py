from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.audit_event import AuditEventType


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID

    event_type: AuditEventType

    entity_type: str
    entity_id: UUID | None

    action: str
    description: str | None

    event_metadata: dict | None

    ip_address: str | None
    user_agent: str | None

    created_at: datetime
