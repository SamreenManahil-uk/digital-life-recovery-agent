import { api } from "./client";

export type RecoveryMethod = {
  id: string;
  service_account_id: string;
  method_type: string;
  label: string;
  is_available: boolean;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoveryAction = {
  id: string;
  user_id: string;
  recovery_plan_id: string;
  service_account_id: string;
  step_order: number;
  title: string;
  description: string | null;
  action_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RecoveryPlan = {
  id: string;
  user_id: string;
  incident_id: string;
  status: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
  actions: RecoveryAction[];
};

export async function getRecoveryMethods(
  serviceAccountId?: string,
) {
  const response = await api.get<RecoveryMethod[]>(
    "/recovery-methods",
    {
      params: serviceAccountId
        ? {
            service_account_id:
              serviceAccountId,
          }
        : undefined,
    },
  );

  return response.data;
}

export async function getRecoveryMethod(
  methodId: string,
) {
  const response =
    await api.get<RecoveryMethod>(
      `/recovery-methods/${methodId}`,
    );

  return response.data;
}

export async function updateRecoveryMethod(
  methodId: string,
  payload: Partial<
    Pick<
      RecoveryMethod,
      | "label"
      | "is_available"
      | "is_verified"
      | "is_primary"
    >
  >,
) {
  const response =
    await api.patch<RecoveryMethod>(
      `/recovery-methods/${methodId}`,
      payload,
    );

  return response.data;
}

export async function getIncidentRecoveryPlan(
  incidentId: string,
) {
  const response =
    await api.get<RecoveryPlan>(
      `/incidents/${incidentId}/recovery-plan`,
    );

  return response.data;
}

export async function createRecoveryPlan(
  incidentId: string,
) {
  const response =
    await api.post<RecoveryPlan>(
      `/incidents/${incidentId}/recovery-plan`,
    );

  return response.data;
}

export async function getRecoveryPlan(
  planId: string,
) {
  const response =
    await api.get<RecoveryPlan>(
      `/recovery-plans/${planId}`,
    );

  return response.data;
}

export async function updateRecoveryAction(
  actionId: string,
  status: string,
) {
  const response =
    await api.patch<RecoveryAction>(
      `/recovery-actions/${actionId}`,
      { status },
    );

  return response.data;
}
