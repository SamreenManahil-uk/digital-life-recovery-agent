export type ServiceType =
  | "email"
  | "device"
  | "social"
  | "developer"
  | "cloud"
  | "financial"
  | "storage"
  | "communication"
  | "other";

export type ServiceAccount = {
  id: string;
  user_id: string;
  name: string;
  provider: string;
  service_type: ServiceType;
  criticality: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceCreate = {
  name: string;
  provider: string;
  service_type: ServiceType;
  criticality: number;
  description?: string | null;
};

export type ServiceUpdate = {
  name?: string;
  provider?: string;
  service_type?: ServiceType;
  criticality?: number;
  description?: string | null;
  is_active?: boolean;
};

export type DependencyType =
  | "two_factor_for"
  | "login_identity_for"
  | "recovery_channel_for"
  | "controls"
  | "hosts"
  | "billing_for"
  | "required_for"
  | "other";

export type DependencyRelationship = {
  id: string;
  user_id: string;
  source_service_id: string;
  target_service_id: string;
  relationship_type: DependencyType;
  is_critical: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DependencyCreate = {
  source_service_id: string;
  target_service_id: string;
  relationship_type: DependencyType;
  is_critical: boolean;
  notes?: string | null;
};

export type IncidentStatus =
  | "open"
  | "investigating"
  | "contained"
  | "resolved"
  | "closed";

export type IncidentSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type Incident = {
  id: string;
  user_id: string;
  root_service_id: string;
  title: string;
  description?: string | null;
  severity: IncidentSeverity | string;
  status: IncidentStatus | string;
  created_at: string;
  updated_at: string;
};

export type IncidentImpact = {
  id?: string;
  incident_id: string;
  service_account_id: string;
  impact_type: string;
  dependency_depth: number;
  criticality: number;
  impact_score: number;
  is_access_blocked: boolean;
  explanation?: string | null;
  created_at?: string;
};

export type IncidentAnalysis = {
  incident_id: string;
  root_service_id: string;
  affected_service_count: number;
  impacts: IncidentImpact[];
};


export type GraphNode = {
  id: string;
  name: string;
  provider: string;
  service_type: ServiceType;
  criticality: number;
  is_active: boolean;
};

export type GraphEdge = {
  id: string;
  source_service_id: string;
  target_service_id: string;
  relationship_type: DependencyType;
  is_critical: boolean;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
};

export type GraphImpactItem = {
  id: string;
  name: string;
  criticality: number;
  dependency_depth: number;
};

export type GraphImpactResponse = {
  root_service_id: string;
  root_service_name: string;
  affected_service_count: number;
  impacts: GraphImpactItem[];
};

export type SinglePointOfFailure = {
  id: string;
  name: string;
  criticality: number;
  downstream_count: number;
};

export type SinglePointsOfFailureResponse = {
  count: number;
  items: SinglePointOfFailure[];
};

export type GraphSyncResponse = {
  status: string;
  services: number;
  dependencies: number;
};
