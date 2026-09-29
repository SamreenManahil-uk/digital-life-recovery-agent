import "@xyflow/react/dist/style.css";

import axios from "axios";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  GitBranch,
  Link2,
  Network,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  createDependency,
  deleteDependency,
  getDependencies,
} from "../api/dependencies";

import { getServices } from "../api/services";

import type {
  DependencyCreate,
  DependencyRelationship,
  DependencyType,
  ServiceAccount,
} from "../types";

type GraphNodeData = {
  label: string;
  provider: string;
  criticality: number;
  serviceType: string;
  [key: string]: unknown;
};

const relationshipTypes: {
  value: DependencyType;
  label: string;
  description: string;
}[] = [
  {
    value: "two_factor_for",
    label: "Two-factor authentication",
    description: "Source provides 2FA for target.",
  },
  {
    value: "login_identity_for",
    label: "Login identity",
    description: "Source identity is used to access target.",
  },
  {
    value: "recovery_channel_for",
    label: "Recovery channel",
    description: "Source helps recover target.",
  },
  {
    value: "controls",
    label: "Controls",
    description: "Source controls access to target.",
  },
  {
    value: "hosts",
    label: "Hosts",
    description: "Source hosts or runs target.",
  },
  {
    value: "billing_for",
    label: "Billing",
    description: "Source provides billing for target.",
  },
  {
    value: "required_for",
    label: "Required for",
    description: "Target requires source to operate or recover.",
  },
  {
    value: "other",
    label: "Other",
    description: "Another dependency relationship.",
  },
];

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length) {
      return detail[0]?.msg ?? "Please check the dependency.";
    }

    if (!error.response) {
      return "Unable to reach the LifeGraph API.";
    }
  }

  return "Something went wrong.";
}

function relationshipLabel(type: DependencyType) {
  return (
    relationshipTypes.find((item) => item.value === type)?.label ??
    type.replaceAll("_", " ")
  );
}

function DigitalNode({
  data,
}: NodeProps<Node<GraphNodeData>>) {
  const critical = data.criticality >= 4;

  return (
    <div
      className={`min-w-[190px] rounded-[20px] border px-4 py-3.5 shadow-[0_18px_45px_rgba(0,0,0,.35)] backdrop-blur-2xl ${
        critical
          ? "border-violet-300/[.18] bg-[#151426]/95"
          : "border-white/[.09] bg-[#11131f]/95"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-violet-300"
      />

      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border ${
            critical
              ? "border-violet-300/[.14] bg-violet-300/[.08]"
              : "border-white/[.07] bg-white/[.035]"
          }`}
        >
          <Boxes
            size={14}
            className={
              critical
                ? "text-violet-100/70"
                : "text-white/40"
            }
          />
        </div>

        <div className="min-w-0">
          <div className="max-w-[115px] truncate font-[Manrope] text-[12px] font-bold text-white/80">
            {data.label}
          </div>

          <div className="mt-1 text-[8px] uppercase tracking-[.11em] text-white/25">
            {data.provider} · {data.serviceType}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/[.055] pt-2.5">
        <span className="text-[8px] text-white/22">
          Criticality
        </span>

        <span
          className={`text-[8px] font-bold ${
            critical
              ? "text-violet-200/65"
              : "text-white/35"
          }`}
        >
          {data.criticality}/5
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-cyan-300"
      />
    </div>
  );
}

const nodeTypes = {
  digitalAsset: DigitalNode,
};

function DependencyDrawer({
  services,
  onClose,
  onCreated,
}: {
  services: ServiceAccount[];
  onClose: () => void;
  onCreated: (dependency: DependencyRelationship) => void;
}) {
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");

  const [relationshipType, setRelationshipType] =
    useState<DependencyType>("required_for");

  const [critical, setCritical] = useState(true);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source = services.find((service) => service.id === sourceId);
  const target = services.find((service) => service.id === targetId);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!sourceId || !targetId) {
      setError("Select both source and target assets.");
      return;
    }

    if (sourceId === targetId) {
      setError("Source and target must be different assets.");
      return;
    }

    const payload: DependencyCreate = {
      source_service_id: sourceId,
      target_service_id: targetId,
      relationship_type: relationshipType,
      is_critical: critical,
      notes: notes.trim() || null,
    };

    setSaving(true);
    setError(null);

    try {
      const result = await createDependency(payload);
      onCreated(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close dependency drawer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[110] cursor-default bg-[#04050b]/55 backdrop-blur-sm"
      />

      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 280,
        }}
        className="fixed bottom-0 right-0 top-0 z-[120] w-full max-w-[520px] overflow-y-auto border-l border-white/[.08] bg-[#0d0e18]/95 shadow-[-30px_0_100px_rgba(0,0,0,.55)] backdrop-blur-3xl"
      >
        <div className="relative border-b border-white/[.06] p-7">
          <div className="absolute -right-24 -top-24 h-[260px] w-[260px] rounded-full bg-violet-500/[.11] blur-[90px]" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.18em] text-violet-200/45">
                <GitBranch size={12} />
                Dependency architect
              </div>

              <h2 className="mt-3 font-[Manrope] text-[25px] font-semibold tracking-[-.045em] text-white/90">
                Create dependency
              </h2>

              <p className="mt-2 max-w-[380px] text-[10px] leading-5 text-white/28">
                Define what the target asset depends on.
                The graph flows from source to target.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.03] text-white/30 transition hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 p-7">
          <div className="rounded-[18px] border border-cyan-300/[.09] bg-cyan-300/[.035] p-4">
            <div className="flex gap-3">
              <ArrowRight
                size={15}
                className="mt-0.5 shrink-0 text-cyan-200/55"
              />

              <div>
                <div className="text-[10px] font-bold text-cyan-100/60">
                  Direction matters
                </div>

                <p className="mt-1 text-[9px] leading-4 text-white/28">
                  Source → Target means the target depends on the source.
                  Example: Primary iPhone → Gmail means Gmail depends on
                  Primary iPhone.
                </p>
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Source · required asset
            </span>

            <select
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
              required
              className="h-[52px] w-full rounded-[15px] border border-white/[.07] bg-[#151622] px-4 text-[11px] text-white/65 outline-none focus:border-violet-300/25"
            >
              <option value="">Select source asset</option>

              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {service.provider}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-center">
            <div className="flex h-9 w-9 rotate-90 items-center justify-center rounded-full border border-violet-300/[.1] bg-violet-300/[.05] lg:rotate-0">
              <ArrowRight size={14} className="text-violet-200/55" />
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Target · dependent asset
            </span>

            <select
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              required
              className="h-[52px] w-full rounded-[15px] border border-white/[.07] bg-[#151622] px-4 text-[11px] text-white/65 outline-none focus:border-violet-300/25"
            >
              <option value="">Select target asset</option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                  disabled={service.id === sourceId}
                >
                  {service.name} · {service.provider}
                </option>
              ))}
            </select>
          </label>

          {source && target && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[18px] border border-white/[.06] bg-white/[.02] p-4"
            >
              <div>
                <div className="text-[8px] uppercase tracking-[.12em] text-white/20">
                  Source
                </div>
                <div className="mt-1 truncate text-[10px] font-bold text-white/60">
                  {source.name}
                </div>
              </div>

              <ArrowRight size={14} className="text-cyan-200/45" />

              <div className="text-right">
                <div className="text-[8px] uppercase tracking-[.12em] text-white/20">
                  Target
                </div>
                <div className="mt-1 truncate text-[10px] font-bold text-white/60">
                  {target.name}
                </div>
              </div>
            </motion.div>
          )}

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Relationship
            </span>

            <select
              value={relationshipType}
              onChange={(event) =>
                setRelationshipType(
                  event.target.value as DependencyType,
                )
              }
              className="h-[52px] w-full rounded-[15px] border border-white/[.07] bg-[#151622] px-4 text-[11px] text-white/65 outline-none focus:border-violet-300/25"
            >
              {relationshipTypes.map((relationship) => (
                <option
                  key={relationship.value}
                  value={relationship.value}
                >
                  {relationship.label}
                </option>
              ))}
            </select>

            <div className="mt-2 text-[9px] text-white/20">
              {
                relationshipTypes.find(
                  (item) => item.value === relationshipType,
                )?.description
              }
            </div>
          </label>

          <button
            type="button"
            onClick={() => setCritical((value) => !value)}
            className={`flex w-full items-center justify-between rounded-[17px] border p-4 text-left transition ${
              critical
                ? "border-rose-300/[.12] bg-rose-300/[.045]"
                : "border-white/[.06] bg-white/[.02]"
            }`}
          >
            <div>
              <div className="text-[10px] font-bold text-white/60">
                Critical dependency
              </div>

              <div className="mt-1 text-[9px] text-white/22">
                Flag this relationship as important to recovery.
              </div>
            </div>

            <div
              className={`relative h-6 w-11 rounded-full transition ${
                critical ? "bg-rose-300/30" : "bg-white/[.08]"
              }`}
            >
              <motion.div
                animate={{ x: critical ? 21 : 3 }}
                className="absolute top-1 h-4 w-4 rounded-full bg-white"
              />
            </div>
          </button>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Recovery notes
            </span>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Optional context about why this dependency exists..."
              className="w-full resize-none rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 py-3 text-[11px] leading-5 text-white/65 outline-none placeholder:text-white/15 focus:border-violet-300/25"
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-[15px] border border-rose-300/[.12] bg-rose-300/[.05] px-4 py-3 text-[10px] text-rose-100/65"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] border border-white/[.07] px-4 py-3 text-[10px] font-bold text-white/30"
            >
              Cancel
            </button>

            <button
              disabled={saving || services.length < 2}
              className="flex min-w-[170px] items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[10px] font-extrabold text-[#10111a] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                "Creating..."
              ) : (
                <>
                  <Link2 size={13} />
                  Create dependency
                </>
              )}
            </button>
          </div>
        </form>
      </motion.aside>
    </>
  );
}

export default function DependencyUniversePage() {
  const [services, setServices] = useState<ServiceAccount[]>([]);
  const [dependencies, setDependencies] =
    useState<DependencyRelationship[]>([]);

  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [serviceData, dependencyData] = await Promise.all([
        getServices(),
        getDependencies(),
      ]);

      setServices(serviceData);
      setDependencies(dependencyData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  const serviceMap = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  );

  const graphNodes = useMemo<Node<GraphNodeData>[]>(() => {
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();

    dependencies.forEach((dependency) => {
      incoming.set(
        dependency.target_service_id,
        (incoming.get(dependency.target_service_id) ?? 0) + 1,
      );

      outgoing.set(
        dependency.source_service_id,
        (outgoing.get(dependency.source_service_id) ?? 0) + 1,
      );
    });

    const levels = new Map<string, number>();

    const roots = services.filter(
      (service) => !incoming.has(service.id),
    );

    const queue = roots.map((service) => ({
      id: service.id,
      level: 0,
    }));

    while (queue.length) {
      const current = queue.shift();

      if (!current) break;

      const previous = levels.get(current.id);

      if (previous !== undefined && previous <= current.level) {
        continue;
      }

      levels.set(current.id, current.level);

      dependencies
        .filter(
          (dependency) =>
            dependency.source_service_id === current.id,
        )
        .forEach((dependency) => {
          queue.push({
            id: dependency.target_service_id,
            level: current.level + 1,
          });
        });
    }

    services.forEach((service) => {
      if (!levels.has(service.id)) {
        levels.set(service.id, 0);
      }
    });

    const levelCounts = new Map<number, number>();

    return services.map((service) => {
      const level = levels.get(service.id) ?? 0;
      const row = levelCounts.get(level) ?? 0;

      levelCounts.set(level, row + 1);

      return {
        id: service.id,
        type: "digitalAsset",
        position: {
          x: 70 + level * 270,
          y: 70 + row * 150,
        },
        data: {
          label: service.name,
          provider: service.provider,
          criticality: service.criticality,
          serviceType: service.service_type,
        },
      };
    });
  }, [services, dependencies]);

  const graphEdges = useMemo<Edge[]>(
    () =>
      dependencies.map((dependency) => ({
        id: dependency.id,
        source: dependency.source_service_id,
        target: dependency.target_service_id,
        type: "smoothstep",
        animated: dependency.is_critical,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: dependency.is_critical
            ? "#c4b5fd"
            : "#67e8f9",
        },
        style: {
          stroke: dependency.is_critical
            ? "rgba(196,181,253,.72)"
            : "rgba(103,232,249,.42)",
          strokeWidth: dependency.is_critical ? 2 : 1.4,
        },
        label: relationshipLabel(dependency.relationship_type),
        labelStyle: {
          fill: "rgba(255,255,255,.42)",
          fontSize: 8,
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: "#0b0c16",
          fillOpacity: 0.9,
        },
        labelBgPadding: [5, 3],
        labelBgBorderRadius: 6,
      })),
    [dependencies],
  );

  const criticalDependencies = dependencies.filter(
    (dependency) => dependency.is_critical,
  ).length;

  const connectedAssets = new Set(
    dependencies.flatMap((dependency) => [
      dependency.source_service_id,
      dependency.target_service_id,
    ]),
  ).size;

  async function removeDependency(
    dependency: DependencyRelationship,
  ) {
    const source = serviceMap.get(dependency.source_service_id);
    const target = serviceMap.get(dependency.target_service_id);

    const confirmed = window.confirm(
      `Remove dependency ${source?.name ?? "Source"} → ${
        target?.name ?? "Target"
      }?`,
    );

    if (!confirmed) return;

    setDeletingId(dependency.id);

    try {
      await deleteDependency(dependency.id);

      setDependencies((current) =>
        current.filter((item) => item.id !== dependency.id),
      );
    } catch (requestError) {
      window.alert(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <section className="relative overflow-hidden rounded-[30px] border border-white/[.07] bg-white/[.024] p-6 backdrop-blur-2xl sm:p-8">
        <div className="absolute -right-20 -top-28 h-[300px] w-[300px] rounded-full bg-cyan-400/[.06] blur-[100px]" />
        <div className="absolute left-[30%] top-[-170px] h-[280px] w-[280px] rounded-full bg-violet-500/[.07] blur-[100px]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-cyan-200/40">
              <Network size={13} />
              Living dependency graph
            </div>

            <h1 className="mt-4 font-[Manrope] text-[34px] font-semibold tracking-[-.055em] text-white/90">
              Dependency Universe.
            </h1>

            <p className="mt-2 max-w-[620px] text-[11px] leading-5 text-white/27">
              See how losing one digital asset can cascade through identities,
              developer platforms, cloud services and everything downstream.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadGraph()}
              className="flex items-center gap-2 rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 py-3 text-[9px] font-bold text-white/35 transition hover:text-white/65"
            >
              <RefreshCw size={12} />
              Refresh graph
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              disabled={services.length < 2}
              className="flex items-center gap-2 rounded-[15px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[10px] font-extrabold text-[#10111a] transition hover:-translate-y-0.5 disabled:opacity-40"
            >
              <Plus size={13} />
              Create dependency
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:max-w-[760px] lg:grid-cols-4">
          {[
            ["Assets", services.length],
            ["Dependencies", dependencies.length],
            ["Critical links", criticalDependencies],
            ["Connected assets", connectedAssets],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[18px] border border-white/[.06] bg-black/[.08] p-4"
            >
              <div className="text-[9px] text-white/22">
                {String(label)}
              </div>

              <div className="mt-2 font-[Manrope] text-[22px] font-semibold text-white/75">
                {String(value)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="h-[600px] animate-pulse rounded-[30px] border border-white/[.06] bg-white/[.018]" />
      ) : error ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[30px] border border-rose-300/[.1] bg-rose-300/[.03]">
          <AlertTriangle size={22} className="text-rose-200/55" />

          <div className="mt-4 text-[11px] font-bold text-rose-100/60">
            {error}
          </div>

          <button
            onClick={() => void loadGraph()}
            className="mt-4 rounded-xl border border-white/[.07] px-4 py-2 text-[9px] font-bold text-white/40"
          >
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[30px] border border-dashed border-white/[.08] bg-white/[.012]">
          <Network size={24} className="text-violet-200/35" />

          <h3 className="mt-5 font-[Manrope] text-[17px] font-semibold text-white/60">
            No digital assets yet.
          </h3>

          <p className="mt-2 text-[10px] text-white/22">
            Add assets before creating dependency relationships.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <section className="relative h-[620px] overflow-hidden rounded-[30px] border border-white/[.07] bg-[#090b14]/65 shadow-[0_25px_80px_rgba(0,0,0,.22)]">
            <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/[.07] bg-[#10111b]/80 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.13em] text-white/25 backdrop-blur-xl">
              Source → dependent target
            </div>

            <ReactFlow
              nodes={graphNodes}
              edges={graphEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{
                padding: 0.2,
                maxZoom: 1.1,
              }}
              minZoom={0.35}
              maxZoom={1.5}
              proOptions={{
                hideAttribution: true,
              }}
            >
              <Background
                gap={28}
                size={1}
                color="rgba(255,255,255,.035)"
              />

              <Controls
                position="bottom-left"
                showInteractive={false}
              />
            </ReactFlow>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[25px] border border-white/[.07] bg-white/[.02] p-5">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-violet-200/55" />

                <h3 className="text-[11px] font-bold text-white/60">
                  Dependency intelligence
                </h3>
              </div>

              <p className="mt-3 text-[9px] leading-[17px] text-white/24">
                Every arrow points from a required asset to the asset that
                depends on it. This direction powers incident propagation and
                recovery ordering.
              </p>

              <div className="mt-4 rounded-[16px] border border-violet-300/[.08] bg-violet-300/[.035] p-3">
                <div className="text-[8px] font-bold uppercase tracking-[.12em] text-violet-100/35">
                  Flagship cascade
                </div>

                <div className="mt-2 text-[9px] leading-5 text-white/42">
                  Phone → Gmail → GitHub → Vercel → Website
                </div>
              </div>
            </div>

            <div className="rounded-[25px] border border-white/[.07] bg-white/[.02] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-white/60">
                    Relationships
                  </div>

                  <div className="mt-1 text-[8px] text-white/20">
                    {dependencies.length} mapped links
                  </div>
                </div>

                <ShieldCheck size={15} className="text-emerald-200/45" />
              </div>

              <div className="mt-4 max-h-[345px] space-y-2 overflow-y-auto pr-1">
                {dependencies.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-white/[.07] p-5 text-center">
                    <GitBranch
                      size={16}
                      className="mx-auto text-white/20"
                    />

                    <div className="mt-3 text-[9px] text-white/25">
                      No dependencies mapped yet.
                    </div>
                  </div>
                ) : (
                  dependencies.map((dependency) => {
                    const source = serviceMap.get(
                      dependency.source_service_id,
                    );

                    const target = serviceMap.get(
                      dependency.target_service_id,
                    );

                    return (
                      <motion.div
                        layout
                        key={dependency.id}
                        className="group rounded-[16px] border border-white/[.055] bg-black/[.08] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/52">
                              <span className="truncate">
                                {source?.name ?? "Unknown"}
                              </span>

                              <ArrowRight
                                size={10}
                                className="shrink-0 text-cyan-200/35"
                              />

                              <span className="truncate">
                                {target?.name ?? "Unknown"}
                              </span>
                            </div>

                            <div className="mt-1.5 text-[8px] text-white/20">
                              {relationshipLabel(
                                dependency.relationship_type,
                              )}
                            </div>
                          </div>

                          <button
                            title="Delete dependency"
                            disabled={deletingId === dependency.id}
                            onClick={() =>
                              void removeDependency(dependency)
                            }
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/15 opacity-0 transition hover:bg-rose-300/[.06] hover:text-rose-200/60 group-hover:opacity-100"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>

                        {dependency.is_critical && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-rose-300/[.08] bg-rose-300/[.035] px-2 py-1 text-[7px] font-bold uppercase tracking-[.08em] text-rose-100/40">
                            <AlertTriangle size={8} />
                            Critical
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <DependencyDrawer
            services={services}
            onClose={() => setDrawerOpen(false)}
            onCreated={(dependency) => {
              setDependencies((current) => [
                ...current,
                dependency,
              ]);

              setDrawerOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
