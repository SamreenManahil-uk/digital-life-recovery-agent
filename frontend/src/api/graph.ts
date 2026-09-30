import { api } from "./client";

import type {
  GraphImpactResponse,
  GraphResponse,
  GraphSyncResponse,
  SinglePointsOfFailureResponse,
} from "../types";

export async function getGraph() {
  const response =
    await api.get<GraphResponse>(
      "/graph",
    );

  return response.data;
}

export async function getGraphImpact(
  serviceId: string,
) {
  const response =
    await api.get<GraphImpactResponse>(
      `/graph/impact/${serviceId}`,
    );

  return response.data;
}

export async function getSinglePointsOfFailure() {
  const response =
    await api.get<SinglePointsOfFailureResponse>(
      "/graph/single-points-of-failure",
    );

  return response.data;
}

export async function syncGraph() {
  const response =
    await api.post<GraphSyncResponse>(
      "/graph/sync",
    );

  return response.data;
}
