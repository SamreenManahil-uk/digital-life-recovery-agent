import { api } from "./client";

export type AuditEventType =
  | "user_login"
  | "user_logout"
  | "service_created"
  | "service_updated"
  | "service_deleted"
  | "dependency_created"
  | "dependency_deleted"
  | "incident_created"
  | "incident_updated"
  | "incident_resolved"
  | "recovery_plan_created"
  | "recovery_plan_updated"
  | "recovery_action_started"
  | "recovery_action_completed"
  | "recovery_action_failed"
  | "security_event";

export type AuditEvent = {
  id: string;
  user_id: string;
  event_type: AuditEventType;
  entity_type: string;
  entity_id: string | null;
  action: string;
  description: string | null;
  event_metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AuditEventFilters = {
  event_type?: AuditEventType;
  entity_type?: string;
  limit?: number;
  offset?: number;
};

export async function getAuditEvents(
  filters: AuditEventFilters = {},
) {
  const response = await api.get<AuditEvent[]>(
    "/audit-events",
    {
      params: filters,
    },
  );

  return response.data;
}

export async function getAuditEvent(
  eventId: string,
) {
  const response = await api.get<AuditEvent>(
    `/audit-events/${eventId}`,
  );

  return response.data;
}
