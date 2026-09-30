import {
  Activity,
  Bell,
  Boxes,
  ChevronRight,
  CircleUserRound,
  Command,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import "./App.css";
import DependencyUniverse from "./components/graph/DependencyUniverse";
import AuthScreen from "./components/auth/AuthScreen";
import { useAuth } from "./context/AuthContext";
import GlobalSearch from "./components/command/GlobalSearch";
import NotificationCenter from "./components/command/NotificationCenter";
import DigitalAssetsPage from "./pages/DigitalAssetsPage";
import DependencyUniversePage from "./pages/DependencyUniversePage";
import IncidentsPage from "./pages/IncidentsPage";
import RecoveryPage from "./pages/RecoveryPage";
import RecoveryMethodsPage from "./pages/RecoveryMethodsPage";
import ActivityPage from "./pages/ActivityPage";
import {
  getAuditEvents,
  type AuditEvent,
} from "./api/audit";
import { getServices } from "./api/services";
import {
  getGraph,
  getSinglePointsOfFailure,
} from "./api/graph";
import { getRecoveryMethods } from "./api/recoveryMethods";

type AppPage =
  | "command-center"
  | "digital-assets"
  | "dependency-universe"
  | "incidents"
  | "recovery"
  | "recovery-methods"
  | "activity";

const navItems = [
  {
    id: "command-center" as AppPage,
    label: "Command Center",
    icon: LayoutDashboard,
  },
  {
    id: "digital-assets" as AppPage,
    label: "Digital Assets",
    icon: Boxes,
  },
  {
    id: "dependency-universe" as AppPage,
    label: "Dependency Universe",
    icon: Network,
  },
  {
    id: "incidents" as AppPage,
    label: "Incidents",
    icon: TriangleAlert,
    badge: "2",
  },
  {
    id: "recovery" as AppPage,
    label: "Recovery",
    icon: LifeBuoy,
  },
];

function Sidebar({
  activePage,
  onNavigate,
}: {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}) {
  return (
    <aside className="desktop-sidebar fixed bottom-5 left-5 top-5 z-30 w-[252px]">
      <div className="glass flex h-full flex-col rounded-[28px] p-3">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-400/10 shadow-[0_0_30px_rgba(139,92,246,.12)]">
            <Command size={19} className="text-violet-200" />
          </div>

          <div>
            <div className="font-[Manrope] text-[14px] font-extrabold tracking-[-.02em] text-white">
              LifeGraph
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">
              Recovery Intelligence
            </div>
          </div>
        </div>

        <div className="mx-3 my-2 border-t soft-divider" />

        <div className="px-2 pt-3">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/25">
            Workspace
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.id)}
                  className={`nav-button flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                    isActive ? "active" : ""
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className={
                      isActive
                        ? "text-violet-200"
                        : "text-white/38"
                    }
                  />

                  <span
                    className={`flex-1 text-[13px] font-semibold ${
                      isActive
                        ? "text-white/90"
                        : "text-white/45"
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="rounded-full border border-rose-300/10 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 px-2">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/25">
            Security
          </div>

          <button onClick={() => onNavigate("recovery-methods")} className="nav-button flex w-full items-center gap-3 rounded-2xl px-3 py-3">
            <KeyRound size={17} className="text-white/38" />
            <span className="text-[13px] font-semibold text-white/45">
              Recovery Methods
            </span>
          </button>

          <button onClick={() => onNavigate("activity")} className="nav-button flex w-full items-center gap-3 rounded-2xl px-3 py-3">
            <Activity size={17} className="text-white/38" />
            <span className="text-[13px] font-semibold text-white/45">
              Activity
            </span>
          </button>
        </div>

        <div className="mt-auto">
          <div className="mx-2 mb-2 rounded-[22px] border border-white/[.07] bg-white/[.025] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-emerald-300"
                />
                <span className="text-[11px] font-bold text-white/65">
                  Protection status
                </span>
              </div>

              <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </div>

            <div className="text-[11px] leading-5 text-white/35">
              Core recovery systems are operational.
            </div>
          </div>

          <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/[.04]">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-300/20 to-cyan-300/10">
              <CircleUserRound size={16} className="text-white/65" />
            </div>

            <div className="flex-1 text-left">
              <div className="text-[12px] font-bold text-white/75">
                Samreen
              </div>
              <div className="text-[10px] text-white/30">
                Personal workspace
              </div>
            </div>

            <MoreHorizontal size={15} className="text-white/25" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function ScoreRing() {
  return (
    <div className="relative h-[170px] w-[170px]">
      <svg
        className="h-full w-full -rotate-90"
        viewBox="0 0 160 160"
      >
        <defs>
          <linearGradient id="scoreGradient">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="55%" stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
        </defs>

        <circle
          className="ring-track"
          cx="80"
          cy="80"
          r="63"
          fill="none"
          strokeWidth="8"
        />

        <motion.circle
          className="ring-value"
          cx="80"
          cy="80"
          r="63"
          fill="none"
          strokeWidth="8"
          strokeDasharray="395.84"
          initial={{ strokeDashoffset: 395.84 }}
          animate={{ strokeDashoffset: 110.84 }}
          transition={{
            duration: 1.5,
            ease: [0.2, 0.8, 0.2, 1],
            delay: 0.3,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[Manrope] text-[44px] font-semibold tracking-[-.06em] text-white">
          72
        </span>
        <span className="mt-[-4px] text-[9px] font-bold uppercase tracking-[.2em] text-white/30">
          Resilience
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-soft card-hover rounded-[22px] p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="metric-icon flex h-9 w-9 items-center justify-center rounded-xl">
          <Icon size={16} className="text-violet-100/75" />
        </div>

        <ChevronRight size={14} className="text-white/18" />
      </div>

      <div className="font-[Manrope] text-[26px] font-semibold tracking-[-.04em] text-white/90">
        {value}
      </div>

      <div className="mt-1 text-[11px] font-semibold text-white/55">
        {label}
      </div>

      <div className="mt-1 text-[10px] text-white/25">
        {detail}
      </div>
    </motion.div>
  );
}

function RiskPanel({
  singlePoints,
  recoveryMethods,
  verifiedRecoveryMethods,
}: {
  singlePoints: number;
  recoveryMethods: number;
  verifiedRecoveryMethods: number;
}) {
  const recoveryCoverage =
    recoveryMethods === 0
      ? 0
      : Math.round(
          (verifiedRecoveryMethods / recoveryMethods) * 100,
        );

  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/25">
            Exposure
          </div>
          <div className="mt-2 font-[Manrope] text-[18px] font-semibold text-white/85">
            Risk signals
          </div>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/[.07]">
          <Zap size={16} className="text-amber-200/70" />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[18px] border border-rose-300/[.08] bg-rose-300/[.035] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/70">
              Single points of failure
            </span>
            <span className="text-[18px] font-semibold text-rose-200">
              {singlePoints}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-white/28">
            Assets with downstream dependency exposure
          </div>
        </div>

        <div className="rounded-[18px] border border-white/[.06] bg-white/[.025] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white/60">
              Recovery coverage
            </span>
            <span className="text-[12px] font-bold text-emerald-200/75">
              {recoveryCoverage}%
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.05]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${recoveryCoverage}%`,
              }}
              transition={{ duration: 1.2, delay: 0.7 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-400/80 to-cyan-300/80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function dashboardActivityTitle(
  event: AuditEvent,
) {
  if (event.description?.trim()) {
    return event.description;
  }

  return event.action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function dashboardActivityTime(
  date: string,
) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown time";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) / 1000,
    ),
  );

  if (seconds < 60) {
    return `${Math.max(seconds, 1)}s ago`;
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  return `${days}d ago`;
}

function ActivityPanel({
  events,
  loading,
}: {
  events: AuditEvent[];
  loading: boolean;
}) {
  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/25">
            Live intelligence
          </div>

          <h3 className="mt-2 font-[Manrope] text-[18px] font-semibold text-white/85">
            Recent activity
          </h3>
        </div>

        <Activity
          size={17}
          className="text-violet-200/55"
        />
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="py-8 text-center text-[10px] text-white/25">
            Loading recent activity...
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-[10px] text-white/25">
            No activity recorded yet.
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id}
              className={`flex gap-3 py-4 ${
                index !== events.length - 1
                  ? "border-b soft-divider"
                  : ""
              }`}
            >
              <div className="metric-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                <Activity
                  size={15}
                  className="text-white/55"
                />
              </div>

              <div className="min-w-0">
                <div className="line-clamp-2 text-[11px] font-bold text-white/65">
                  {dashboardActivityTitle(event)}
                </div>

                <div className="mt-1 text-[10px] text-white/25">
                  {event.event_type
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (char) =>
                      char.toUpperCase(),
                    )}{" "}
                  ·{" "}
                  {dashboardActivityTime(
                    event.created_at,
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type DashboardMetrics = {
  assets: number;
  dependencies: number;
  criticalDependencies: number;
  recoveryMethods: number;
  verifiedRecoveryMethods: number;
  singlePoints: number;
};

function App() {
  const { user, loading, logout } = useAuth();

  const [dashboardMetrics, setDashboardMetrics] =
    useState<DashboardMetrics>({
      assets: 0,
      dependencies: 0,
      criticalDependencies: 0,
      recoveryMethods: 0,
      verifiedRecoveryMethods: 0,
      singlePoints: 0,
    });

  const [dashboardMetricsLoading, setDashboardMetricsLoading] =
    useState(true);

  const [recentActivity, setRecentActivity] =
    useState<AuditEvent[]>([]);

  const [recentActivityLoading, setRecentActivityLoading] =
    useState(true);

  const [activePage, setActivePage] =
    useState<AppPage>("command-center");

  const [incidentPhase, setIncidentPhase] =
    useState<"idle" | "running" | "complete">("idle");

  const [incidentRunId, setIncidentRunId] =
    useState(0);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const startIncidentSimulation = () => {
    setIncidentRunId((value) => value + 1);
    setIncidentPhase("running");
  };

  const completeIncidentSimulation =
    useCallback(() => {
      setIncidentPhase("complete");
    }, []);

  useEffect(() => {
    if (!user) {
      setDashboardMetricsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDashboardMetrics() {
      setDashboardMetricsLoading(true);

      try {
        const [
          services,
          graph,
          singlePointData,
          recoveryMethods,
        ] = await Promise.all([
          getServices(),
          getGraph(),
          getSinglePointsOfFailure(),
          getRecoveryMethods(),
        ]);

        if (cancelled) return;

        setDashboardMetrics({
          assets: services.length,
          dependencies: graph.edge_count,
          criticalDependencies: graph.edges.filter(
            (edge) => edge.is_critical,
          ).length,
          recoveryMethods: recoveryMethods.length,
          verifiedRecoveryMethods: recoveryMethods.filter(
            (method) => method.is_verified,
          ).length,
          singlePoints: singlePointData.count,
        });
      } catch (error) {
        console.error(
          "Failed to load command center metrics:",
          error,
        );
      } finally {
        if (!cancelled) {
          setDashboardMetricsLoading(false);
        }
      }
    }

    void loadDashboardMetrics();

    return () => {
      cancelled = true;
    };
  }, [user, activePage]);

  useEffect(() => {
    if (!user) {
      setRecentActivity([]);
      setRecentActivityLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRecentActivity() {
      setRecentActivityLoading(true);

      try {
        const events = await getAuditEvents({
          limit: 3,
          offset: 0,
        });

        if (!cancelled) {
          setRecentActivity(events);
        }
      } catch (error) {
        console.error(
          "Failed to load recent activity:",
          error,
        );

        if (!cancelled) {
          setRecentActivity([]);
        }
      } finally {
        if (!cancelled) {
          setRecentActivityLoading(false);
        }
      }
    }

    void loadRecentActivity();

    return () => {
      cancelled = true;
    };
  }, [user, activePage]);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060710]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-200/15 border-t-violet-200/70" />
          <div className="mt-4 text-[9px] font-bold uppercase tracking-[.18em] text-white/25">
            Restoring secure session
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="aurora-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="aurora aurora-three" />

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <main className="main-offset ml-[282px] min-h-screen px-5 pb-8 pt-5 lg:px-8">
        <header className="mx-auto flex max-w-[1500px] items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <button className="glass-soft flex h-10 w-10 items-center justify-center rounded-2xl lg:hidden">
              <Menu size={17} className="text-white/60" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="status-dot h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span className="text-[9px] font-bold uppercase tracking-[.18em] text-emerald-200/55">
                  {activePage === "digital-assets"
                    ? "Inventory protected"
                    : activePage === "dependency-universe"
                      ? "Dependency graph online"
                      : activePage === "incidents"
                        ? "Incident command online"
                        : activePage === "recovery"
                          ? "Recovery intelligence online"
                          : activePage === "activity"
                            ? "Audit trail online"
                            : "System protected"}
                </span>
              </div>

              <h1 className="mt-1 font-[Manrope] text-[22px] font-semibold tracking-[-.04em] text-white/90">
                {activePage === "digital-assets"
                  ? "Digital Assets"
                  : activePage === "dependency-universe"
                    ? "Dependency Universe"
                    : activePage === "incidents"
                      ? "Incidents"
                      : activePage === "recovery"
                        ? "Recovery"
                        : activePage === "activity"
                          ? "Activity"
                          : "Command Center"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="glass-soft hidden h-10 items-center gap-2 rounded-2xl px-3 text-white/35 transition hover:text-white/65 sm:flex"
            >
              <Search size={15} />
              <span className="text-[11px]">
                Search your digital life
              </span>
              <span className="ml-3 rounded-md border border-white/[.07] px-1.5 py-0.5 text-[9px] text-white/20">
                ⌘ K
              </span>
            </button>

            <button
              onClick={() =>
                setNotificationsOpen(true)
              }
              className="glass-soft relative flex h-10 w-10 items-center justify-center rounded-2xl transition hover:bg-white/[.06]"
            >
              <Bell
                size={16}
                className="text-white/45"
              />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,.8)]" />
            </button>

            <button className="glass-soft flex h-10 w-10 items-center justify-center rounded-2xl">
              <Settings size={16} className="text-white/45" />
            </button>
          </div>
        </header>

        <div className="mx-auto mt-6 max-w-[1500px]">
          {activePage === "digital-assets" ? (
            <DigitalAssetsPage />
          ) : activePage === "dependency-universe" ? (
            <DependencyUniversePage />
          ) : activePage === "incidents" ? (
            <IncidentsPage />
          ) : activePage === "recovery" ? (
            <RecoveryPage />
          ) : activePage === "recovery-methods" ? (
            <RecoveryMethodsPage />
          ) : activePage === "activity" ? (
            <ActivityPage />
          ) : (
            <>
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="glass relative overflow-hidden rounded-[32px] px-6 py-6 lg:px-8"
          >
            <div className="absolute right-[-120px] top-[-180px] h-[420px] w-[420px] rounded-full bg-violet-400/[.08] blur-[80px]" />
            <div className="absolute bottom-[-220px] left-[35%] h-[380px] w-[380px] rounded-full bg-cyan-300/[.05] blur-[100px]" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.25fr_.75fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/[.1] bg-violet-300/[.055] px-3 py-1.5">
                  <Sparkles size={12} className="text-violet-200/70" />
                  <span className="text-[9px] font-bold uppercase tracking-[.16em] text-violet-100/50">
                    Digital resilience intelligence
                  </span>
                </div>

                <h2 className="gradient-text max-w-[650px] font-[Manrope] text-[34px] font-semibold leading-[1.12] tracking-[-.055em] md:text-[42px]">
                  Your digital life,
                  <br />
                  mapped before it breaks.
                </h2>

                <p className="mt-4 max-w-[590px] text-[12px] leading-6 text-white/35">
                  Understand how your identities, devices, cloud
                  services and recovery methods depend on each
                  other — before one failure becomes five.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#11111b] shadow-[0_10px_30px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5"
                    onClick={() => setActivePage("digital-assets")}><Plus size={14} />
                    Add digital asset
                  </button>

                  <button
                    onClick={startIncidentSimulation}
                    disabled={incidentPhase === "running"}
                    className={`glass-soft flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[11px] font-bold transition ${
                      incidentPhase === "running"
                        ? "cursor-wait text-rose-200/60"
                        : "text-white/55 hover:text-white/80"
                    }`}
                  >
                    <TriangleAlert size={14} />
                    {incidentPhase === "running"
                      ? "Analyzing cascade..."
                      : incidentPhase === "complete"
                        ? "Run again"
                        : "Simulate incident"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-end">
                <ScoreRing />
              </div>
            </div>
          </motion.section>

          <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={Boxes}
              value={
                dashboardMetricsLoading
                  ? "—"
                  : String(dashboardMetrics.assets)
              }
              label="Digital assets"
              detail="PostgreSQL inventory"
            />

            <MetricCard
              icon={Network}
              value={
                dashboardMetricsLoading
                  ? "—"
                  : String(dashboardMetrics.dependencies)
              }
              label="Dependencies"
              detail={`${dashboardMetrics.criticalDependencies} critical links`}
            />

            <MetricCard
              icon={ShieldCheck}
              value={
                dashboardMetricsLoading
                  ? "—"
                  : String(dashboardMetrics.recoveryMethods)
              }
              label="Recovery methods"
              detail={`${dashboardMetrics.verifiedRecoveryMethods} verified`}
            />

            <MetricCard
              icon={TriangleAlert}
              value={
                dashboardMetricsLoading
                  ? "—"
                  : String(dashboardMetrics.singlePoints)
              }
              label="Single points"
              detail={
                dashboardMetrics.singlePoints === 0
                  ? "No failure points"
                  : "Need attention"
              }
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <DependencyUniverse
              incidentPhase={incidentPhase}
              incidentRunId={incidentRunId}
              onIncidentComplete={completeIncidentSimulation}
            />

            <RiskPanel
              singlePoints={dashboardMetrics.singlePoints}
              recoveryMethods={dashboardMetrics.recoveryMethods}
              verifiedRecoveryMethods={
                dashboardMetrics.verifiedRecoveryMethods
              }
            />
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="glass rounded-[28px] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/25">
                    Recovery readiness
                  </div>

                  <h3 className="mt-2 font-[Manrope] text-[18px] font-semibold text-white/85">
                    Identity protection
                  </h3>
                </div>

                <span className="rounded-full border border-emerald-300/[.1] bg-emerald-300/[.055] px-3 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-emerald-200/60">
                  {dashboardMetricsLoading
                    ? "Loading"
                    : dashboardMetrics.recoveryMethods === 0
                      ? "Setup needed"
                      : dashboardMetrics.verifiedRecoveryMethods ===
                          dashboardMetrics.recoveryMethods &&
                        dashboardMetrics.singlePoints === 0
                        ? "Protected"
                        : "Improving"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Verified methods",
                    value: `${dashboardMetrics.verifiedRecoveryMethods} / ${dashboardMetrics.recoveryMethods}`,
                    width:
                      dashboardMetrics.recoveryMethods === 0
                        ? "0%"
                        : `${Math.round(
                            (dashboardMetrics.verifiedRecoveryMethods /
                              dashboardMetrics.recoveryMethods) *
                              100,
                          )}%`,
                  },
                  {
                    label: "Recovery methods",
                    value: String(
                      dashboardMetrics.recoveryMethods,
                    ),
                    width:
                      dashboardMetrics.recoveryMethods > 0
                        ? "100%"
                        : "0%",
                  },
                  {
                    label: "Failure points",
                    value: String(
                      dashboardMetrics.singlePoints,
                    ),
                    width:
                      dashboardMetrics.singlePoints === 0
                        ? "100%"
                        : `${Math.max(
                            10,
                            100 -
                              dashboardMetrics.singlePoints *
                                20,
                          )}%`,
                  },
                ].map(
                  ({
                    label,
                    value,
                    width,
                  }) => (
                    <div
                      key={label}
                      className="rounded-[20px] border border-white/[.06] bg-white/[.025] p-4"
                    >
                      <div className="text-[10px] text-white/30">
                        {label}
                      </div>

                      <div className="mt-2 font-[Manrope] text-[20px] font-semibold text-white/75">
                        {dashboardMetricsLoading
                          ? "—"
                          : value}
                      </div>

                      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[.05]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width:
                              dashboardMetricsLoading
                                ? "0%"
                                : width,
                          }}
                          transition={{
                            duration: 1,
                            delay: 0.35,
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-violet-400/75 to-cyan-300/70"
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <ActivityPanel
              events={recentActivity}
              loading={recentActivityLoading}
            />
          </section>

            </>
          )}

          <footer className="flex items-center justify-between px-2 pb-2 pt-7 text-[9px] text-white/20">
            <span>
              Digital Life Recovery Intelligence
            </span>

            <span>
              Live recovery intelligence
            </span>
          </footer>
        </div>
      </main>
      <button
        onClick={logout}
        title="Sign out"
        className="fixed bottom-6 left-[185px] z-[70] hidden rounded-xl border border-white/[.07] bg-[#151622]/90 px-3 py-2 text-[9px] font-bold text-white/35 shadow-xl backdrop-blur-xl transition hover:border-rose-300/15 hover:text-rose-200 lg:block"
      >
        Sign out · {user.display_name}
      </button>

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NotificationCenter
        open={notificationsOpen}
        onClose={() =>
          setNotificationsOpen(false)
        }
      />
    </div>
  );
}

export default App;
