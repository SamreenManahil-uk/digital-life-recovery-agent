import { api } from "./client";

import type {
  ServiceAccount,
  ServiceCreate,
  ServiceUpdate,
} from "../types";

export async function getServices() {
  const response =
    await api.get<ServiceAccount[]>(
      "/services",
    );

  return response.data;
}

export async function createService(
  payload: ServiceCreate,
) {
  const response =
    await api.post<ServiceAccount>(
      "/services",
      payload,
    );

  return response.data;
}

export async function updateService(
  serviceId: string,
  payload: ServiceUpdate,
) {
  const response =
    await api.patch<ServiceAccount>(
      `/services/${serviceId}`,
      payload,
    );

  return response.data;
}

export async function deleteService(
  serviceId: string,
) {
  await api.delete(
    `/services/${serviceId}`,
  );
}
