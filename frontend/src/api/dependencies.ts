import { api } from "./client";

import type {
  DependencyCreate,
  DependencyRelationship,
} from "../types";

export async function getDependencies() {
  const response =
    await api.get<DependencyRelationship[]>(
      "/dependencies",
    );

  return response.data;
}

export async function createDependency(
  payload: DependencyCreate,
) {
  const response =
    await api.post<DependencyRelationship>(
      "/dependencies",
      payload,
    );

  return response.data;
}

export async function deleteDependency(
  dependencyId: string,
) {
  await api.delete(
    `/dependencies/${dependencyId}`,
  );
}
