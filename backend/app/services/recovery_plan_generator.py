from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.recovery_action import (
    RecoveryAction,
    RecoveryActionStatus,
    RecoveryActionType,
)
from app.models.recovery_plan import (
    RecoveryPlan,
    RecoveryPlanStatus,
)
from app.models.service_account import ServiceAccount
from app.services.recovery_intelligence import (
    AccessRiskState,
    RecoveryIntelligence,
    build_recovery_intelligence,
)


def determine_action_type(
    intelligence: RecoveryIntelligence,
) -> RecoveryActionType:
    """
    Map deterministic recovery intelligence to an action type.
    """

    if intelligence.dependency_depth == 0:
        return RecoveryActionType.RESTORE_ACCESS

    if (
        intelligence.access_risk_state
        == AccessRiskState.RESILIENT
    ):
        return RecoveryActionType.VERIFY_DEPENDENCY

    if (
        intelligence.access_risk_state
        == AccessRiskState.RECOVERABLE
    ):
        return RecoveryActionType.VERIFY_RECOVERY_METHOD

    if (
        intelligence.access_risk_state
        == AccessRiskState.HIGH_RISK
    ):
        return RecoveryActionType.CONTACT_SUPPORT

    return RecoveryActionType.OTHER


def build_action_content(
    service_name: str,
    intelligence: RecoveryIntelligence,
    action_type: RecoveryActionType,
) -> tuple[str, str, str | None]:
    """
    Build deterministic human-readable recovery instructions.
    """

    if action_type == RecoveryActionType.RESTORE_ACCESS:
        return (
            f"Restore access to {service_name}",
            (
                f"Recover or secure {service_name} first because "
                f"it is the root service for this incident. "
                f"Confirm control of the service before continuing "
                f"with dependent services."
            ),
            (
                "Root service is currently considered unavailable "
                "or inaccessible."
            ),
        )

    if action_type == RecoveryActionType.VERIFY_DEPENDENCY:
        return (
            f"Verify {service_name} access",
            (
                f"Verify that {service_name} remains accessible "
                f"after the upstream incident. Recovery readiness "
                f"is {intelligence.readiness_level.value} with a "
                f"score of {intelligence.readiness_score:.2f}/100."
            ),
            None,
        )

    if action_type == RecoveryActionType.VERIFY_RECOVERY_METHOD:
        return (
            f"Verify recovery method for {service_name}",
            (
                f"Test the verified recovery method for "
                f"{service_name} before making credential or "
                f"two-factor authentication changes. Recovery "
                f"readiness is "
                f"{intelligence.readiness_level.value}."
            ),
            None,
        )

    if action_type == RecoveryActionType.CONTACT_SUPPORT:
        return (
            f"Recover high-risk service {service_name}",
            (
                f"{service_name} has insufficient verified recovery "
                f"readiness. Review available recovery options and "
                f"use the provider's official account recovery or "
                f"support process if required."
            ),
            (
                f"Access risk is "
                f"{intelligence.access_risk_state.value}; "
                f"verified recovery methods may be insufficient."
            ),
        )

    return (
        f"Review {service_name}",
        (
            f"Review the recovery requirements for {service_name} "
            f"and confirm access manually."
        ),
        None,
    )


def generate_recovery_plan(
    db: Session,
    user_id: UUID,
    incident_id: UUID,
) -> RecoveryPlan:
    """
    Generate an ordered deterministic recovery plan for an incident.

    Re-running replaces previous generated plans for this incident,
    preventing stale or duplicate recovery workflows.
    """

    incident_statement = (
        select(Incident)
        .where(
            Incident.id == incident_id,
            Incident.user_id == user_id,
        )
    )

    incident = db.execute(
        incident_statement
    ).scalar_one_or_none()

    if incident is None:
        raise ValueError(
            "Incident does not exist or does not belong "
            "to this user."
        )

    intelligence_results = build_recovery_intelligence(
        db=db,
        user_id=user_id,
        root_service_id=incident.root_service_id,
    )

    if not intelligence_results:
        raise ValueError(
            "No recovery intelligence could be generated."
        )

    service_ids = [
        result.service_id
        for result in intelligence_results
    ]

    service_statement = (
        select(
            ServiceAccount.id,
            ServiceAccount.name,
        )
        .where(
            ServiceAccount.user_id == user_id,
            ServiceAccount.id.in_(service_ids),
        )
    )

    service_rows = db.execute(
        service_statement
    ).all()

    service_names = {
        row.id: row.name
        for row in service_rows
    }

    if len(service_names) != len(service_ids):
        raise ValueError(
            "One or more services required for the recovery "
            "plan could not be loaded."
        )

    # Delete old generated plans.
    # recovery_actions are removed through ON DELETE CASCADE.
    db.execute(
        delete(RecoveryPlan).where(
            RecoveryPlan.user_id == user_id,
            RecoveryPlan.incident_id == incident_id,
        )
    )

    root_name = service_names[
        incident.root_service_id
    ]

    plan = RecoveryPlan(
        user_id=user_id,
        incident_id=incident_id,
        status=RecoveryPlanStatus.READY,
        title=f"Recovery plan for {incident.title}",
        summary=(
            f"Deterministic recovery plan generated for "
            f"{root_name}. "
            f"{len(intelligence_results)} affected services "
            f"require review in dependency order."
        ),
    )

    db.add(plan)
    db.flush()

    ordered_results = sorted(
        intelligence_results,
        key=lambda item: (
            item.dependency_depth,
            -item.impact_score,
        ),
    )

    for step_order, intelligence in enumerate(
        ordered_results,
        start=1,
    ):
        service_name = service_names[
            intelligence.service_id
        ]

        action_type = determine_action_type(
            intelligence
        )

        title, instructions, blocking_reason = (
            build_action_content(
                service_name=service_name,
                intelligence=intelligence,
                action_type=action_type,
            )
        )

        action = RecoveryAction(
            user_id=user_id,
            recovery_plan_id=plan.id,
            service_account_id=(
                intelligence.service_id
            ),
            step_order=step_order,
            action_type=action_type,
            status=RecoveryActionStatus.PENDING,
            title=title,
            instructions=instructions,
            blocking_reason=blocking_reason,
        )

        db.add(action)

    db.flush()
    db.refresh(plan)

    return plan
