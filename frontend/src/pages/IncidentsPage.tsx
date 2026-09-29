import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";

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

import axios from "axios";

import {
  analyzeIncident,
  createIncident,
  getIncidentImpacts,
  getIncidents,
} from "../api/incidents";

import { getServices } from "../api/services";

import type {
  Incident,
  IncidentAnalysis,
  IncidentImpact,
  ServiceAccount,
} from "../types";

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length) {
      return detail[0]?.msg ?? "Request failed.";
    }

    if (!error.response) {
      return "Unable to reach the recovery API.";
    }
  }

  return "Something went wrong.";
}

function severityClass(severity: string) {
  const value = severity.toLowerCase();

  if (value === "critical") {
    return "border-rose-300/[.14] bg-rose-300/[.06] text-rose-100/70";
  }

  if (value === "high") {
    return "border-orange-300/[.12] bg-orange-300/[.05] text-orange-100/65";
  }

  if (value === "medium") {
    return "border-amber-300/[.12] bg-amber-300/[.045] text-amber-100/60";
  }

  return "border-cyan-300/[.1] bg-cyan-300/[.04] text-cyan-100/55";
}

function IncidentCard({
  incident,
  services,
  selected,
  onSelect,
}: {
  incident: Incident;
  services: ServiceAccount[];
  selected: boolean;
  onSelect: () => void;
}) {
  const root = services.find(
    (service) => service.id === incident.root_service_id,
  );

  return (
    <motion.button
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`w-full rounded-[22px] border p-5 text-left transition ${
        selected
          ? "border-violet-300/[.16] bg-violet-300/[.055] shadow-[0_18px_55px_rgba(124,58,237,.12)]"
          : "border-white/[.06] bg-white/[.02] hover:border-white/[.1] hover:bg-white/[.035]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-white/[.07] bg-white/[.035]">
            <TriangleAlert
              size={16}
              className="text-violet-200/55"
            />
          </div>

          <div className="min-w-0">
            <div className="truncate font-[Manrope] text-[12px] font-bold text-white/75">
              {incident.title}
            </div>

            <div className="mt-1 truncate text-[9px] text-white/22">
              Root asset · {root?.name ?? "Unknown asset"}
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[7px] font-extrabold uppercase tracking-[.1em] ${severityClass(
            incident.severity,
          )}`}
        >
          {incident.severity}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[.05] pt-3">
        <span className="flex items-center gap-1.5 text-[8px] text-white/22">
          <Clock3 size={10} />
          {new Date(incident.created_at).toLocaleString()}
        </span>

        <span className="rounded-full bg-white/[.035] px-2 py-1 text-[7px] font-bold uppercase tracking-[.08em] text-white/25">
          {incident.status}
        </span>
      </div>
    </motion.button>
  );
}

function CreateIncidentDrawer({
  services,
  onClose,
  onCreated,
}: {
  services: ServiceAccount[];
  onClose: () => void;
  onCreated: (incident: Incident) => void;
}) {
  const [rootServiceId, setRootServiceId] =
    useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [severity, setSeverity] =
    useState("high");

  const [incidentType, setIncidentType] =
    useState("service_unavailable");

  const [saving, setSaving] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!rootServiceId) {
      setError("Select the affected root asset.");
      return;
    }

    if (!title.trim()) {
      setError("Enter an incident title.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const incident = await createIncident({
        root_service_id: rootServiceId,
        incident_type: incidentType,
        title: title.trim(),
        description:
          description.trim() || null,
        severity,
      });

      onCreated(incident);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[110] bg-[#03040a]/60 backdrop-blur-sm"
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
        className="fixed bottom-0 right-0 top-0 z-[120] w-full max-w-[510px] overflow-y-auto border-l border-white/[.08] bg-[#0c0d17]/95 shadow-[-30px_0_100px_rgba(0,0,0,.6)] backdrop-blur-3xl"
      >
        <div className="border-b border-white/[.06] p-7">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.17em] text-rose-200/45">
                <ShieldAlert size={12} />
                Incident command
              </div>

              <h2 className="mt-3 font-[Manrope] text-[25px] font-semibold tracking-[-.045em] text-white/90">
                Create incident
              </h2>

              <p className="mt-2 text-[10px] leading-5 text-white/25">
                This creates a real incident in the recovery system.
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.03] text-white/30"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 p-7"
        >
          
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
              Incident type
            </span>

            <select
              value={incidentType}
              onChange={(event) =>
                setIncidentType(event.target.value)
              }
              className="w-full rounded-2xl border border-white/[.07] bg-white/[.035] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/30"
            >
              <option value="access_lost">Access lost</option>
              <option value="device_lost">Device lost</option>
              <option value="compromised">Compromised</option>
              <option value="credential_failure">Credential failure</option>
              <option value="recovery_failure">Recovery failure</option>
              <option value="service_unavailable">Service unavailable</option>
              <option value="other">Other</option>
            </select>
          </label>

<label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Root digital asset
            </span>

            <select
              required
              value={rootServiceId}
              onChange={(event) =>
                setRootServiceId(
                  event.target.value,
                )
              }
              className="h-[52px] w-full rounded-[15px] border border-white/[.07] bg-[#151622] px-4 text-[11px] text-white/65 outline-none focus:border-violet-300/25"
            >
              <option value="">
                Select affected asset
              </option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name} · {service.provider}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Incident title
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Primary device unavailable"
              className="h-[52px] w-full rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 text-[11px] text-white/65 outline-none placeholder:text-white/15 focus:border-violet-300/25"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Severity
            </span>

            <select
              value={severity}
              onChange={(event) =>
                setSeverity(event.target.value)
              }
              className="h-[52px] w-full rounded-[15px] border border-white/[.07] bg-[#151622] px-4 text-[11px] text-white/65 outline-none focus:border-violet-300/25"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Description
            </span>

            <textarea
              rows={5}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Describe what happened..."
              className="w-full resize-none rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 py-3 text-[11px] leading-5 text-white/65 outline-none placeholder:text-white/15 focus:border-violet-300/25"
            />
          </label>

          {error && (
            <div className="rounded-[15px] border border-rose-300/[.12] bg-rose-300/[.045] px-4 py-3 text-[10px] text-rose-100/65">
              {error}
            </div>
          )}

          <button
            disabled={saving || services.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-4 text-[10px] font-extrabold text-[#10111a] disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2
                  size={13}
                  className="animate-spin"
                />
                Creating incident...
              </>
            ) : (
              <>
                <Plus size={13} />
                Create real incident
              </>
            )}
          </button>
        </form>
      </motion.aside>
    </>
  );
}

export default function IncidentsPage() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [services, setServices] =
    useState<ServiceAccount[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [analysis, setAnalysis] =
    useState<IncidentAnalysis | null>(null);

  const [impacts, setImpacts] =
    useState<IncidentImpact[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incidentData, serviceData] =
        await Promise.all([
          getIncidents(),
          getServices(),
        ]);

      setIncidents(incidentData);
      setServices(serviceData);

      if (
        incidentData.length > 0 &&
        !selectedId
      ) {
        setSelectedId(incidentData[0].id);
      }
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedIncident =
    incidents.find(
      (incident) => incident.id === selectedId,
    ) ?? null;

  const rootService =
    services.find(
      (service) =>
        service.id ===
        selectedIncident?.root_service_id,
    ) ?? null;

  async function runAnalysis() {
    if (!selectedIncident) return;

    setAnalyzing(true);
    setError(null);

    try {
      const result =
        await analyzeIncident(
          selectedIncident.id,
        );

      setAnalysis(result);
      setImpacts(result.impacts);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setAnalyzing(false);
    }
  }

  async function loadImpacts() {
    if (!selectedIncident) return;

    try {
      const result =
        await getIncidentImpacts(
          selectedIncident.id,
        );

      setImpacts(result);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  useEffect(() => {
    setAnalysis(null);
    setImpacts([]);

    if (selectedIncident) {
      void loadImpacts();
    }
    // Selected incident intentionally controls this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const criticalImpacts =
    impacts.filter(
      (impact) =>
        impact.is_access_blocked ||
        impact.criticality >= 4,
    ).length;

  const statusCounts =
    useMemo(() => {
      return incidents.reduce(
        (acc, incident) => {
          const key =
            incident.status.toLowerCase();

          acc[key] =
            (acc[key] ?? 0) + 1;

          return acc;
        },
        {} as Record<string, number>,
      );
    }, [incidents]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <section className="relative overflow-hidden rounded-[30px] border border-white/[.07] bg-white/[.024] p-6 backdrop-blur-2xl sm:p-8">
        <div className="absolute -right-28 -top-36 h-[360px] w-[360px] rounded-full bg-rose-400/[.055] blur-[110px]" />
        <div className="absolute left-[38%] top-[-190px] h-[300px] w-[300px] rounded-full bg-violet-500/[.06] blur-[100px]" />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-rose-200/45">
              <ShieldAlert size={13} />
              Incident command
            </div>

            <h1 className="mt-4 font-[Manrope] text-[34px] font-semibold tracking-[-.055em] text-white/90">
              Incidents.
            </h1>

            <p className="mt-2 max-w-[650px] text-[11px] leading-5 text-white/27">
              Real incidents from the recovery database. Analyse
              dependency impact only when you choose to run the
              analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void load()}
              className="flex items-center gap-2 rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 py-3 text-[9px] font-bold text-white/35 hover:text-white/65"
            >
              <RefreshCw size={12} />
              Refresh
            </button>

            <button
              onClick={() =>
                setDrawerOpen(true)
              }
              className="flex items-center gap-2 rounded-[15px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[10px] font-extrabold text-[#10111a]"
            >
              <Plus size={13} />
              Create incident
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total incidents", incidents.length],
            ["Open", statusCounts.open ?? 0],
            ["Investigating", statusCounts.investigating ?? 0],
            ["Critical impact", criticalImpacts],
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

      {error && (
        <div className="flex items-center gap-3 rounded-[17px] border border-rose-300/[.1] bg-rose-300/[.035] px-4 py-3 text-[10px] text-rose-100/60">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="h-[540px] animate-pulse rounded-[28px] border border-white/[.06] bg-white/[.018]" />
          <div className="h-[540px] animate-pulse rounded-[28px] border border-white/[.06] bg-white/[.018]" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex min-h-[450px] flex-col items-center justify-center rounded-[30px] border border-dashed border-white/[.08] bg-white/[.012]">
          <ShieldCheck
            size={27}
            className="text-emerald-200/35"
          />

          <h2 className="mt-5 font-[Manrope] text-[18px] font-semibold text-white/60">
            No incidents recorded.
          </h2>

          <p className="mt-2 max-w-[390px] text-center text-[10px] leading-5 text-white/22">
            Create a real incident from one of your digital assets
            to begin dependency-impact analysis.
          </p>

          <button
            onClick={() =>
              setDrawerOpen(true)
            }
            className="mt-6 flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[9px] font-extrabold text-[#10111a]"
          >
            <Plus size={12} />
            Create first incident
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <div className="text-[10px] font-bold text-white/45">
                  Recorded incidents
                </div>

                <div className="mt-1 text-[8px] text-white/20">
                  {incidents.length} real database records
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  services={services}
                  selected={
                    incident.id === selectedId
                  }
                  onSelect={() =>
                    setSelectedId(incident.id)
                  }
                />
              ))}
            </div>
          </section>

          <section className="min-h-[560px] rounded-[28px] border border-white/[.07] bg-white/[.018] p-6">
            {selectedIncident ? (
              <>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[7px] font-extrabold uppercase tracking-[.1em] ${severityClass(
                          selectedIncident.severity,
                        )}`}
                      >
                        {selectedIncident.severity}
                      </span>

                      <span className="rounded-full bg-white/[.035] px-2.5 py-1 text-[7px] font-bold uppercase tracking-[.08em] text-white/25">
                        {selectedIncident.status}
                      </span>
                    </div>

                    <h2 className="mt-4 font-[Manrope] text-[24px] font-semibold tracking-[-.045em] text-white/80">
                      {selectedIncident.title}
                    </h2>

                    <p className="mt-2 max-w-[620px] text-[10px] leading-5 text-white/25">
                      {selectedIncident.description ||
                        "No incident description was provided."}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      void runAnalysis()
                    }
                    disabled={analyzing}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[9px] font-extrabold text-[#10111a] disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <Loader2
                          size={12}
                          className="animate-spin"
                        />
                        Analysing...
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={12} />
                        Analyse impact
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-white/[.055] bg-black/[.08] p-4">
                    <div className="text-[8px] uppercase tracking-[.1em] text-white/20">
                      Root asset
                    </div>

                    <div className="mt-2 truncate text-[10px] font-bold text-white/55">
                      {rootService?.name ??
                        "Unknown"}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-white/[.055] bg-black/[.08] p-4">
                    <div className="text-[8px] uppercase tracking-[.1em] text-white/20">
                      Affected
                    </div>

                    <div className="mt-2 text-[18px] font-semibold text-white/60">
                      {analysis?.affected_service_count ??
                        impacts.length}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-white/[.055] bg-black/[.08] p-4">
                    <div className="text-[8px] uppercase tracking-[.1em] text-white/20">
                      Critical
                    </div>

                    <div className="mt-2 text-[18px] font-semibold text-rose-100/60">
                      {criticalImpacts}
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-[22px] border border-white/[.055] bg-black/[.08] p-5">
                  <div className="flex items-center gap-2">
                    <Zap
                      size={14}
                      className="text-violet-200/55"
                    />

                    <div className="text-[10px] font-bold text-white/55">
                      Dependency impact
                    </div>
                  </div>

                  {impacts.length === 0 ? (
                    <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
                      <BrainCircuit
                        size={21}
                        className="text-white/15"
                      />

                      <div className="mt-4 text-[10px] text-white/25">
                        Impact analysis has not been run.
                      </div>

                      <div className="mt-1 text-[8px] text-white/15">
                        Run Analyse impact to calculate real
                        downstream effects.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {impacts.map(
                        (impact, index) => {
                          const service =
                            services.find(
                              (item) =>
                                item.id ===
                                impact.service_account_id,
                            );

                          return (
                            <motion.div
                              key={
                                impact.id ??
                                `${impact.service_account_id}-${index}`
                              }
                              initial={{
                                opacity: 0,
                                x: -8,
                              }}
                              animate={{
                                opacity: 1,
                                x: 0,
                              }}
                              transition={{
                                delay:
                                  index * 0.045,
                              }}
                              className="flex items-center gap-3 rounded-[16px] border border-white/[.05] bg-white/[.018] p-3"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-300/[.06]">
                                {impact.is_access_blocked ? (
                                  <ShieldAlert
                                    size={13}
                                    className="text-rose-200/55"
                                  />
                                ) : (
                                  <ShieldCheck
                                    size={13}
                                    className="text-cyan-200/45"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-[10px] font-bold text-white/55">
                                    {service?.name ??
                                      "Unknown asset"}
                                  </span>

                                  <ArrowRight
                                    size={10}
                                    className="text-white/15"
                                  />

                                  <span className="text-[8px] text-white/20">
                                    depth{" "}
                                    {
                                      impact.dependency_depth
                                    }
                                  </span>
                                </div>

                                <div className="mt-1 text-[8px] text-white/20">
                                  {impact.impact_type}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-[9px] font-bold text-white/40">
                                  {impact.impact_score.toFixed(
                                    1,
                                  )}
                                </div>

                                <div className="mt-1 text-[7px] uppercase tracking-[.08em] text-white/15">
                                  impact
                                </div>
                              </div>

                              {impact.is_access_blocked && (
                                <CheckCircle2
                                  size={13}
                                  className="text-rose-200/45"
                                />
                              )}
                            </motion.div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex min-h-[500px] items-center justify-center text-[10px] text-white/20">
                Select an incident.
              </div>
            )}
          </section>
        </div>
      )}

      <AnimatePresence>
        {drawerOpen && (
          <CreateIncidentDrawer
            services={services}
            onClose={() =>
              setDrawerOpen(false)
            }
            onCreated={(incident) => {
              setIncidents((current) => [
                incident,
                ...current,
              ]);

              setSelectedId(incident.id);
              setDrawerOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
