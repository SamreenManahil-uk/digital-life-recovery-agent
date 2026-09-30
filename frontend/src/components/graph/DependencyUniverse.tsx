import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  Cloud,
  Database,
  GitBranch,
  Globe2,
  Mail,
  Network,
  Server,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  getGraph,
  getGraphImpact,
} from "../../api/graph";

import type {
  GraphImpactResponse,
  GraphNode,
} from "../../types";

export type IncidentPhase =
  | "idle"
  | "running"
  | "complete";

type ServiceData = {
  label: string;
  subtitle: string;
  kind: string;
  risk: number;
  criticality: number;
  recovery: string;
  status: string;
};

type DependencyUniverseProps = {
  incidentPhase: IncidentPhase;
  incidentRunId: number;
  onIncidentComplete?: () => void;
};

function getServiceIcon(kind: string) {
  const value = kind.toLowerCase();

  if (
    value.includes("phone") ||
    value.includes("device")
  ) {
    return Smartphone;
  }

  if (
    value.includes("email") ||
    value.includes("mail")
  ) {
    return Mail;
  }

  if (
    value.includes("developer") ||
    value.includes("code") ||
    value.includes("repository")
  ) {
    return GitBranch;
  }

  if (
    value.includes("cloud") ||
    value.includes("storage")
  ) {
    return Cloud;
  }

  if (
    value.includes("website") ||
    value.includes("domain")
  ) {
    return Globe2;
  }

  if (value.includes("database")) {
    return Database;
  }

  return Server;
}

function ServiceNode({
  data,
  selected,
}: NodeProps<Node<ServiceData>>) {
  const Icon = getServiceIcon(data.kind);

  return (
    <motion.div
      animate={{
        scale: selected ? 1.035 : 1,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`
        min-w-[180px] rounded-[22px] border p-4
        ${
          selected
            ? "border-violet-300/40 bg-violet-300/[.12] shadow-[0_0_45px_rgba(139,92,246,.18)]"
            : "border-white/[.09] bg-[#11121e]/85 shadow-[0_18px_45px_rgba(0,0,0,.28)]"
        }
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-violet-300/70"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-cyan-200/70"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/[.08] bg-gradient-to-br from-violet-300/[.13] to-cyan-300/[.05]">
          <Icon
            size={18}
            strokeWidth={1.7}
            className="text-white/70"
          />
        </div>

        <span
          className={`mt-1 h-2 w-2 rounded-full ${
            data.risk >= 80
              ? "bg-rose-300"
              : data.risk >= 50
                ? "bg-amber-200"
                : "bg-emerald-300"
          }`}
        />
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-bold text-white/80">
          {data.label}
        </div>

        <div className="mt-1 text-[9px] text-white/30">
          {data.subtitle}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3">
        <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-white/25">
          Criticality
        </span>

        <span className="text-[11px] font-bold text-white/65">
          {data.criticality}/5
        </span>
      </div>
    </motion.div>
  );
}

const nodeTypes = {
  service: ServiceNode,
};

function toServiceData(
  node: GraphNode,
): ServiceData {
  return {
    label: node.name,
    subtitle: node.provider || node.service_type,
    kind: node.service_type,
    risk: Math.min(
      100,
      Math.max(0, node.criticality * 20),
    ),
    criticality: node.criticality,
    recovery: "View recovery intelligence",
    status: node.is_active ? "Active" : "Inactive",
  };
}

function calculatePositions(
  graphNodes: GraphNode[],
) {
  const columns = 3;
  const horizontalGap = 260;
  const verticalGap = 190;

  return new Map(
    graphNodes.map((node, index) => [
      node.id,
      {
        x: (index % columns) * horizontalGap + 70,
        y:
          Math.floor(index / columns) *
            verticalGap +
          130,
      },
    ]),
  );
}

function AssetDrawer({
  service,
  impact,
  impactLoading,
  onClose,
}: {
  service: ServiceData | null;
  impact: GraphImpactResponse | null;
  impactLoading: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {service && (
        <motion.aside
          initial={{
            opacity: 0,
            x: 65,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          exit={{
            opacity: 0,
            x: 65,
          }}
          className="absolute bottom-4 right-4 top-4 z-40 w-[340px] overflow-y-auto rounded-[26px] border border-white/[.11] bg-[#11121d]/95 p-5 shadow-[0_30px_90px_rgba(0,0,0,.5)] backdrop-blur-3xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-violet-300/[.13] bg-violet-300/[.08]">
              <Network
                size={19}
                className="text-violet-100/75"
              />
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.035] text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-6 text-[9px] font-bold uppercase tracking-[.18em] text-violet-200/40">
            Digital asset
          </div>

          <h3 className="mt-2 font-[Manrope] text-[25px] font-semibold tracking-[-.04em] text-white/90">
            {service.label}
          </h3>

          <p className="mt-1 text-[11px] text-white/30">
            {service.subtitle}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/[.06] bg-white/[.025] p-4">
              <div className="text-[9px] text-white/25">
                Criticality
              </div>

              <div className="mt-2 text-[16px] font-bold text-white/70">
                {service.criticality}/5
              </div>
            </div>

            <div className="rounded-[18px] border border-white/[.06] bg-white/[.025] p-4">
              <div className="text-[9px] text-white/25">
                Status
              </div>

              <div className="mt-2 text-[13px] font-bold text-emerald-200/70">
                {service.status}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-violet-300/[.08] bg-violet-300/[.035] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={14}
                className="text-violet-200/70"
              />

              <span className="text-[9px] font-bold uppercase tracking-[.12em] text-white/40">
                Neo4j blast radius
              </span>
            </div>

            {impactLoading ? (
              <div className="mt-3 text-[9px] text-white/30">
                Analysing dependency graph...
              </div>
            ) : impact ? (
              <>
                <div className="mt-3 font-[Manrope] text-[27px] font-semibold text-white/85">
                  {impact.affected_service_count}
                </div>

                <div className="text-[9px] text-white/25">
                  downstream assets affected
                </div>

                {impact.impacts.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {impact.impacts
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-white/[.05] bg-black/[.08] px-3 py-2"
                        >
                          <span className="truncate text-[9px] text-white/45">
                            {item.name}
                          </span>

                          <span className="ml-3 shrink-0 text-[8px] font-bold text-violet-100/40">
                            depth {item.dependency_depth}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="mt-3 text-[9px] leading-4 text-emerald-100/45">
                    No downstream dependency exposure.
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3 text-[9px] text-white/30">
                Impact intelligence unavailable.
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default function DependencyUniverse({
  incidentPhase: _incidentPhase,
  incidentRunId: _incidentRunId,
  onIncidentComplete: _onIncidentComplete,
}: DependencyUniverseProps) {
  const [graph, setGraph] =
    useState<Awaited<
      ReturnType<typeof getGraph>
    > | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [impact, setImpact] =
    useState<GraphImpactResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [impactLoading, setImpactLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGraph() {
      setLoading(true);
      setError(null);

      try {
        const result = await getGraph();

        if (!cancelled) {
          setGraph(result);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load the Neo4j dependency graph.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGraph();

    return () => {
      cancelled = true;
    };
  }, []);

  const positions = useMemo(
    () =>
      calculatePositions(
        graph?.nodes ?? [],
      ),
    [graph],
  );

  const nodes = useMemo<Node<ServiceData>[]>(
    () =>
      (graph?.nodes ?? []).map((node) => ({
        id: node.id,
        type: "service",
        position:
          positions.get(node.id) ?? {
            x: 0,
            y: 0,
          },
        selected: node.id === selectedId,
        data: toServiceData(node),
      })),
    [
      graph,
      positions,
      selectedId,
    ],
  );

  const edges = useMemo<Edge[]>(
    () =>
      (graph?.edges ?? []).map(
        (edge) => ({
          id: edge.id,
          source: edge.source_service_id,
          target: edge.target_service_id,
          type: "smoothstep",
          animated: edge.is_critical,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: edge.is_critical
              ? "rgba(251,113,133,.72)"
              : "rgba(196,181,253,.45)",
          },
          style: {
            stroke: edge.is_critical
              ? "rgba(251,113,133,.62)"
              : "rgba(196,181,253,.30)",
            strokeWidth: edge.is_critical
              ? 2
              : 1.4,
          },
        }),
      ),
    [graph],
  );

  const selectedService = useMemo(
    () => {
      const node = graph?.nodes.find(
        (item) => item.id === selectedId,
      );

      return node
        ? toServiceData(node)
        : null;
    },
    [graph, selectedId],
  );

  const onNodeClick = useCallback(
    async (
      _event: React.MouseEvent,
      node: Node<ServiceData>,
    ) => {
      setSelectedId(node.id);
      setImpact(null);
      setImpactLoading(true);

      try {
        const result =
          await getGraphImpact(node.id);

        setImpact(result);
      } catch {
        setImpact(null);
      } finally {
        setImpactLoading(false);
      }
    },
    [],
  );

  return (
    <div className="glass relative h-[500px] overflow-hidden rounded-[28px]">
      <div className="pointer-events-none absolute left-5 top-5 z-20">
        <div className="flex items-center gap-2">
          <Network
            size={14}
            className="text-violet-200/60"
          />

          <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/28">
            Dependency Universe
          </span>
        </div>

        <h2 className="mt-2 font-[Manrope] text-[19px] font-semibold tracking-[-.03em] text-white/85">
          Live Neo4j ecosystem
        </h2>

        <p className="mt-1 text-[10px] text-white/25">
          Select an asset to inspect its real dependency
          blast radius.
        </p>
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center text-[11px] text-white/30">
          Loading Neo4j dependency graph...
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center px-8 text-center text-[11px] text-rose-200/55">
          {error}
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center text-[11px] text-white/30">
          No digital assets available yet.
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => {
            setSelectedId(null);
            setImpact(null);
          }}
          fitView
          fitViewOptions={{
            padding: 0.18,
          }}
          minZoom={0.5}
          maxZoom={1.45}
          proOptions={{
            hideAttribution: true,
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={1}
            color="rgba(255,255,255,.055)"
          />

          <Controls
            showInteractive={false}
            className="!bottom-4 !left-4 !overflow-hidden !rounded-xl !border !border-white/[.08] !bg-[#11121e]/80 !shadow-none"
          />
        </ReactFlow>
      )}

      {!loading && !error && (
        <div className="pointer-events-none absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border border-white/[.06] bg-[#0d0e18]/65 px-3 py-2 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.7)]" />

          <span className="text-[9px] font-semibold text-white/30">
            Neo4j live · {graph?.node_count ?? 0} nodes ·{" "}
            {graph?.edge_count ?? 0} edges
          </span>
        </div>
      )}

      <AssetDrawer
        service={selectedService}
        impact={impact}
        impactLoading={impactLoading}
        onClose={() => {
          setSelectedId(null);
          setImpact(null);
        }}
      />
    </div>
  );
}
