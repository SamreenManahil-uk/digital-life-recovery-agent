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
  GitBranch,
  Globe2,
  Mail,
  Network,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "motion/react";

export type IncidentPhase =
  | "idle"
  | "running"
  | "complete";

type ServiceKind =
  | "phone"
  | "email"
  | "developer"
  | "cloud"
  | "website";

type ServiceData = {
  label: string;
  subtitle: string;
  kind: ServiceKind;
  risk: number;
  criticality: number;
  recovery: string;
  status: string;
  incidentState?: "normal" | "root" | "affected";
};

type DependencyUniverseProps = {
  incidentPhase: IncidentPhase;
  incidentRunId: number;
  onIncidentComplete?: () => void;
};

const iconMap = {
  phone: Smartphone,
  email: Mail,
  developer: GitBranch,
  cloud: Cloud,
  website: Globe2,
};

const baseNodes: Node<ServiceData>[] = [
  {
    id: "phone",
    type: "service",
    position: { x: 20, y: 170 },
    data: {
      label: "Primary iPhone",
      subtitle: "Trusted device",
      kind: "phone",
      risk: 100,
      criticality: 5,
      recovery: "Strong",
      status: "Protected",
    },
  },
  {
    id: "gmail",
    type: "service",
    position: { x: 240, y: 65 },
    data: {
      label: "Gmail",
      subtitle: "Primary identity",
      kind: "email",
      risk: 90,
      criticality: 5,
      recovery: "Strong",
      status: "Protected",
    },
  },
  {
    id: "github",
    type: "service",
    position: { x: 465, y: 195 },
    data: {
      label: "GitHub",
      subtitle: "Developer identity",
      kind: "developer",
      risk: 60,
      criticality: 4,
      recovery: "Moderate",
      status: "Protected",
    },
  },
  {
    id: "vercel",
    type: "service",
    position: { x: 690, y: 75 },
    data: {
      label: "Vercel",
      subtitle: "Cloud deployment",
      kind: "cloud",
      risk: 48,
      criticality: 4,
      recovery: "Weak",
      status: "Protected",
    },
  },
  {
    id: "portfolio",
    type: "service",
    position: { x: 910, y: 190 },
    data: {
      label: "Portfolio",
      subtitle: "Public service",
      kind: "website",
      risk: 27,
      criticality: 3,
      recovery: "Weak",
      status: "Protected",
    },
  },
];

const dependencyPairs = [
  ["phone", "gmail"],
  ["gmail", "github"],
  ["github", "vercel"],
  ["vercel", "portfolio"],
] as const;

function ServiceNode({
  data,
  selected,
}: NodeProps<Node<ServiceData>>) {
  const Icon = iconMap[data.kind];

  const isRoot = data.incidentState === "root";
  const isAffected = data.incidentState === "affected";
  const isIncident = isRoot || isAffected;

  return (
    <motion.div
      animate={
        isRoot
          ? {
              scale: [1, 1.055, 1],
            }
          : {
              scale: 1,
            }
      }
      transition={
        isRoot
          ? {
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
      whileHover={{
        scale: 1.04,
        y: -3,
      }}
      className={`
        relative min-w-[150px] rounded-[22px]
        border px-4 py-4 backdrop-blur-xl
        transition-all duration-500
        ${
          isRoot
            ? "border-rose-300/50 bg-rose-400/[.13] shadow-[0_0_55px_rgba(244,63,94,.23)]"
            : isAffected
              ? "border-amber-200/30 bg-amber-300/[.07] shadow-[0_0_40px_rgba(251,191,36,.10)]"
              : selected
                ? "border-violet-300/40 bg-violet-300/[.12] shadow-[0_0_45px_rgba(139,92,246,.18)]"
                : "border-white/[.09] bg-[#11121e]/85 shadow-[0_18px_45px_rgba(0,0,0,.28)]"
        }
      `}
    >
      {isIncident && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.25, 0.65, 0.25],
            scale: [0.92, 1.15, 0.92],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
          }}
          className={`
            pointer-events-none absolute -inset-2
            rounded-[26px] border
            ${
              isRoot
                ? "border-rose-300/20"
                : "border-amber-200/10"
            }
          `}
        />
      )}

      <Handle
        type="target"
        position={Position.Left}
        className={`
          !h-2 !w-2 !border-0
          ${
            isIncident
              ? "!bg-rose-300"
              : "!bg-violet-300/70"
          }
        `}
      />

      <Handle
        type="source"
        position={Position.Right}
        className={`
          !h-2 !w-2 !border-0
          ${
            isIncident
              ? "!bg-rose-300"
              : "!bg-cyan-200/70"
          }
        `}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`
            flex h-10 w-10 items-center justify-center
            rounded-[14px] border
            ${
              isRoot
                ? "border-rose-300/20 bg-rose-300/[.1]"
                : isAffected
                  ? "border-amber-200/15 bg-amber-200/[.06]"
                  : "border-white/[.08] bg-gradient-to-br from-violet-300/[.13] to-cyan-300/[.05]"
            }
          `}
        >
          <Icon
            size={18}
            strokeWidth={1.7}
            className={
              isRoot
                ? "text-rose-100"
                : isAffected
                  ? "text-amber-100/80"
                  : "text-white/70"
            }
          />
        </div>

        <span
          className={`
            mt-1 h-2 w-2 rounded-full
            ${
              isRoot
                ? "bg-rose-300 shadow-[0_0_14px_rgba(253,164,175,.9)]"
                : isAffected
                  ? "bg-amber-200 shadow-[0_0_12px_rgba(253,230,138,.65)]"
                  : data.risk >= 80
                    ? "bg-rose-300"
                    : data.risk >= 50
                      ? "bg-amber-200"
                      : "bg-emerald-300"
            }
          `}
        />
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-bold text-white/80">
          {data.label}
        </div>

        <div className="mt-1 text-[9px] text-white/30">
          {isRoot
            ? "Access lost · Root incident"
            : isAffected
              ? "Cascade impact detected"
              : data.subtitle}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3">
        <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-white/25">
          Risk
        </span>

        <span
          className={`text-[11px] font-bold ${
            isRoot
              ? "text-rose-200"
              : isAffected
                ? "text-amber-100"
                : "text-white/65"
          }`}
        >
          {data.risk}
        </span>
      </div>
    </motion.div>
  );
}

const nodeTypes = {
  service: ServiceNode,
};

function AssetDrawer({
  service,
  onClose,
}: {
  service: ServiceData | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {service && (
        <motion.aside
          initial={{
            opacity: 0,
            x: 65,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            x: 65,
            scale: 0.98,
          }}
          transition={{
            duration: 0.3,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className="
            absolute bottom-4 right-4 top-4 z-40
            w-[340px] overflow-hidden rounded-[26px]
            border border-white/[.11]
            bg-[#11121d]/95 p-5
            shadow-[0_30px_90px_rgba(0,0,0,.5)]
            backdrop-blur-3xl
          "
        >
          <div className="absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-violet-400/[.11] blur-[70px]" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-violet-300/[.13] bg-violet-300/[.08]">
                {(() => {
                  const Icon = iconMap[service.kind];

                  return (
                    <Icon
                      size={19}
                      className="text-violet-100/75"
                    />
                  );
                })()}
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.035] text-white/40 transition hover:bg-white/[.08] hover:text-white"
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

            <div className="mt-6 rounded-[20px] border border-white/[.07] bg-white/[.035] p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[.15em] text-white/25">
                    Risk exposure
                  </div>

                  <div className="mt-2 font-[Manrope] text-[38px] font-semibold tracking-[-.06em] text-white">
                    {service.risk}
                  </div>
                </div>

                <div className="rounded-full bg-rose-300/[.08] px-3 py-1 text-[9px] font-bold text-rose-200">
                  {service.risk >= 80
                    ? "Critical"
                    : service.risk >= 50
                      ? "Elevated"
                      : "Moderate"}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
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
                  Recovery
                </div>
                <div className="mt-2 text-[16px] font-bold text-white/70">
                  {service.recovery}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-[18px] border border-white/[.06] bg-white/[.025] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">
                  Current status
                </span>

                <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-200/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {service.status}
                </span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function ImpactDrawer({
  visibleCount,
  complete,
  onClose,
}: {
  visibleCount: number;
  complete: boolean;
  onClose: () => void;
}) {
  const impacts = [
    {
      name: "Primary iPhone",
      depth: 0,
      score: 100,
      label: "ROOT",
    },
    {
      name: "Gmail",
      depth: 1,
      score: 90,
      label: "DIRECT",
    },
    {
      name: "GitHub",
      depth: 2,
      score: 60,
      label: "INDIRECT",
    },
    {
      name: "Vercel",
      depth: 3,
      score: 48,
      label: "INDIRECT",
    },
    {
      name: "Portfolio",
      depth: 4,
      score: 27,
      label: "INDIRECT",
    },
  ];

  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: 70,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      className="
        absolute bottom-4 right-4 top-4 z-40
        w-[355px] overflow-y-auto rounded-[26px]
        border border-rose-300/[.12]
        bg-[#12121d]/95 p-5
        shadow-[0_30px_100px_rgba(0,0,0,.55)]
        backdrop-blur-3xl
      "
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-[240px] w-[240px] rounded-full bg-rose-400/[.1] blur-[75px]" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-rose-300/[.15] bg-rose-300/[.08]">
            <TriangleAlert
              size={19}
              className="text-rose-200"
            />
          </div>

          {complete && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.035] text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="mt-5 text-[9px] font-bold uppercase tracking-[.18em] text-rose-200/45">
          Live impact analysis
        </div>

        <h3 className="mt-2 font-[Manrope] text-[24px] font-semibold tracking-[-.04em] text-white/90">
          Phone access lost
        </h3>

        <p className="mt-2 text-[10px] leading-5 text-white/30">
          Mapping downstream dependency exposure and
          recovery risk.
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-[16px] border border-rose-300/[.09] bg-rose-300/[.04] px-3 py-3">
          <motion.span
            animate={
              complete
                ? {}
                : {
                    opacity: [0.35, 1, 0.35],
                  }
            }
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className={`h-2 w-2 rounded-full ${
              complete
                ? "bg-emerald-300"
                : "bg-rose-300"
            }`}
          />

          <span className="text-[10px] font-bold text-white/55">
            {complete
              ? "Cascade analysis complete"
              : "Analyzing dependency chain..."}
          </span>
        </div>

        <div className="mt-5 space-y-2">
          <AnimatePresence>
            {impacts
              .slice(0, visibleCount)
              .map((impact, index) => (
                <motion.div
                  key={impact.name}
                  initial={{
                    opacity: 0,
                    x: 18,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  }}
                  transition={{
                    duration: 0.35,
                  }}
                  className="rounded-[17px] border border-white/[.065] bg-white/[.028] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        flex h-7 w-7 items-center justify-center
                        rounded-full text-[9px] font-extrabold
                        ${
                          index === 0
                            ? "bg-rose-300/[.12] text-rose-200"
                            : "bg-amber-200/[.07] text-amber-100/70"
                        }
                      `}
                    >
                      {impact.depth}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-white/65">
                        {impact.name}
                      </div>

                      <div className="mt-0.5 text-[8px] font-bold tracking-[.1em] text-white/20">
                        {impact.label}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-[15px] font-bold ${
                          impact.score >= 80
                            ? "text-rose-200"
                            : impact.score >= 50
                              ? "text-amber-100"
                              : "text-white/55"
                        }`}
                      >
                        {impact.score}
                      </div>

                      <div className="text-[8px] uppercase tracking-[.1em] text-white/20">
                        risk
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {complete && (
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-5 rounded-[18px] border border-violet-300/[.1] bg-violet-300/[.045] p-4"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={14}
                className="text-violet-200/70"
              />
              <span className="text-[10px] font-bold text-white/60">
                5 services affected
              </span>
            </div>

            <p className="mt-2 text-[9px] leading-4 text-white/28">
              A deterministic recovery plan can now be
              generated from this impact snapshot.
            </p>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}

export default function DependencyUniverse({
  incidentPhase,
  incidentRunId,
  onIncidentComplete,
}: DependencyUniverseProps) {
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [affectedCount, setAffectedCount] =
    useState(0);

  useEffect(() => {
    if (incidentPhase !== "running") {
      return;
    }

    setSelectedId(null);
    setAffectedCount(1);

    const timers = [
      window.setTimeout(
        () => setAffectedCount(2),
        700,
      ),
      window.setTimeout(
        () => setAffectedCount(3),
        1400,
      ),
      window.setTimeout(
        () => setAffectedCount(4),
        2100,
      ),
      window.setTimeout(
        () => setAffectedCount(5),
        2800,
      ),
      window.setTimeout(
        () => onIncidentComplete?.(),
        3500,
      ),
    ];

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [
    incidentPhase,
    incidentRunId,
    onIncidentComplete,
  ]);

  useEffect(() => {
    if (incidentPhase === "idle") {
      setAffectedCount(0);
    }
  }, [incidentPhase]);

  const affectedIds = useMemo(
    () =>
      [
        "phone",
        "gmail",
        "github",
        "vercel",
        "portfolio",
      ].slice(0, affectedCount),
    [affectedCount],
  );

  const nodes = useMemo<Node<ServiceData>[]>(
    () =>
      baseNodes.map((node): Node<ServiceData> => {
        const incidentState: ServiceData["incidentState"] =
          node.id === "phone" &&
          affectedIds.includes(node.id)
            ? "root"
            : affectedIds.includes(node.id)
              ? "affected"
              : "normal";

        return {
          ...node,
          selected: node.id === selectedId,
          data: {
            ...node.data,
            incidentState,
          },
        };
      }),
    [
      selectedId,
      affectedIds,
    ],
  );

  const edges: Edge[] = useMemo(
    () =>
      dependencyPairs.map(
        ([source, target], index) => {
          const active =
            affectedCount >= index + 2;

          return {
            id: `${source}-${target}`,
            source,
            target,
            type: "smoothstep",
            animated:
              incidentPhase === "idle"
                ? true
                : active,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: active
                ? "rgba(251,113,133,.85)"
                : "rgba(196,181,253,.45)",
              width: 14,
              height: 14,
            },
            style: {
              stroke: active
                ? "rgba(251,113,133,.72)"
                : "rgba(196,181,253,.30)",
              strokeWidth: active
                ? 2.2
                : 1.4,
            },
          };
        },
      ),
    [
      affectedCount,
      incidentPhase,
    ],
  );

  const selectedService = useMemo(
    () =>
      baseNodes.find(
        (node) => node.id === selectedId,
      )?.data ?? null,
    [selectedId],
  );

  const onNodeClick = useCallback(
    (
      _event: React.MouseEvent,
      node: Node<ServiceData>,
    ) => {
      if (incidentPhase !== "idle") {
        return;
      }

      setSelectedId(node.id);
    },
    [incidentPhase],
  );

  const incidentVisible =
    incidentPhase !== "idle";

  return (
    <div className="glass relative h-[500px] overflow-hidden rounded-[28px]">
      <AnimatePresence>
        {incidentVisible && (
          <motion.div
            initial={{
              opacity: 0,
              y: -15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -15,
            }}
            className="absolute left-5 right-5 top-4 z-30 flex items-center justify-between rounded-[18px] border border-rose-300/[.12] bg-rose-300/[.055] px-4 py-3 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale:
                    incidentPhase === "running"
                      ? [1, 1.15, 1]
                      : 1,
                }}
                transition={{
                  repeat:
                    incidentPhase === "running"
                      ? Infinity
                      : 0,
                  duration: 1,
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-300/[.1]"
              >
                <TriangleAlert
                  size={15}
                  className="text-rose-200"
                />
              </motion.div>

              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-[.18em] text-rose-200/70">
                  Incident detected
                </div>

                <div className="mt-0.5 text-[10px] text-white/45">
                  Primary iPhone · Access lost
                </div>
              </div>
            </div>

            <div className="text-[9px] font-bold uppercase tracking-[.15em] text-white/25">
              {incidentPhase === "running"
                ? "Propagation active"
                : "Analysis complete"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!incidentVisible && (
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
            Your digital ecosystem
          </h2>

          <p className="mt-1 text-[10px] text-white/25">
            Select any service to inspect its recovery
            intelligence.
          </p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => {
          if (incidentPhase === "idle") {
            setSelectedId(null);
          }
        }}
        fitView
        fitViewOptions={{
          padding: 0.16,
        }}
        minZoom={0.55}
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

      {!incidentVisible && (
        <div className="pointer-events-none absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border border-white/[.06] bg-[#0d0e18]/65 px-3 py-2 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,.7)]" />

          <span className="text-[9px] font-semibold text-white/30">
            Live dependency map
          </span>
        </div>
      )}

      {!incidentVisible && (
        <AssetDrawer
          service={selectedService}
          onClose={() => setSelectedId(null)}
        />
      )}

      {incidentVisible && (
        <ImpactDrawer
          visibleCount={affectedCount}
          complete={
            incidentPhase === "complete"
          }
          onClose={() => {
            setAffectedCount(0);
          }}
        />
      )}
    </div>
  );
}
