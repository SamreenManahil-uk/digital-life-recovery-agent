import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecoveryMethodType(str, Enum):
    RECOVERY_EMAIL = "recovery_email"
    PHONE_NUMBER = "phone_number"
    AUTHENTICATOR_APP = "authenticator_app"
    BACKUP_CODES = "backup_codes"
    TRUSTED_DEVICE = "trusted_device"
    SECURITY_KEY = "security_key"
    SUPPORT_PROCESS = "support_process"
    OTHER = "other"


class RecoveryMethod(Base):
    __tablename__ = "recovery_methods"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    service_account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("service_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    method_type: Mapped[RecoveryMethodType] = mapped_column(
        SQLEnum(
            RecoveryMethodType,
            name="recovery_method_type_enum",
            values_callable=lambda enum_class: [
                item.value for item in enum_class
            ],
        ),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    is_available: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
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

    service_account: Mapped["ServiceAccount"] = relationship(
        back_populates="recovery_methods",
    )
