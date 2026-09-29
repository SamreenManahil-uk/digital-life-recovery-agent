import { api } from "./client";

import type {
  Incident,
  IncidentAnalysis,
} from "../types";

export type IncidentCreatePayload = {
  root_service_id: string;
  incident_type: string;
  title: string;
  description?: string | null;
  severity: string;
};

export type IncidentUpdatePayload = {
  title?: string;
  description?: string | null;
  severity?: string;
  status?: string;
};

export async function getIncidents() {
  const response =
    await api.get<Incident[]>("/incidents");

  return response.data;
}

export async function createIncident(
  payload: IncidentCreatePayload,
) {
  const response =
    await api.post<Incident>(
      "/incidents",
      payload,
    );

  return response.data;
}

export async function getIncident(
  incidentId: string,
) {
  const response =
    await api.get<Incident>(
      `/incidents/${incidentId}`,
    );

  return response.data;
}

export async function updateIncident(
  incidentId: string,
  payload: IncidentUpdatePayload,
) {
  const response =
    await api.patch<Incident>(
      `/incidents/${incidentId}`,
      payload,
    );

  return response.data;
}

export async function analyzeIncident(
  incidentId: string,
) {
  const response =
    await api.post<IncidentAnalysis>(
      `/incidents/${incidentId}/analyze`,
    );

  return response.data;
}

export async function getIncidentImpacts(
  incidentId: string,
) {
  const response =
    await api.get(
      `/incidents/${incidentId}/impacts`,
    );

  return response.data;
}
