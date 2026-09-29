import { api } from "./client";

export type RecoveryMethodType =
  | "recovery_email"
  | "phone_number"
  | "authenticator_app"
  | "backup_codes"
  | "trusted_device"
  | "security_key"
  | "support_process"
  | "other";

export type RecoveryMethod = {
  id: string;
  service_account_id: string;
  method_type: RecoveryMethodType;
  label: string;
  is_available: boolean;
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type RecoveryMethodCreate = {
  service_account_id: string;
  method_type: RecoveryMethodType;
  label: string;
  is_available: boolean;
  is_verified: boolean;
  is_primary: boolean;
};

export async function getRecoveryMethods() {
  const response =
    await api.get<RecoveryMethod[]>(
      "/recovery-methods",
    );

  return response.data;
}

export async function createRecoveryMethod(
  payload: RecoveryMethodCreate,
) {
  const response =
    await api.post<RecoveryMethod>(
      "/recovery-methods",
      payload,
    );

  return response.data;
}

export async function updateRecoveryMethod(
  id: string,
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
      `/recovery-methods/${id}`,
      payload,
    );

  return response.data;
}

export async function deleteRecoveryMethod(
  id: string,
) {
  await api.delete(
    `/recovery-methods/${id}`,
  );
}
