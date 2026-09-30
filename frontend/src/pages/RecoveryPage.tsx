import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  XCircle,
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
} from "react";

import axios from "axios";

import {
  createRecoveryPlan,
  getIncidentRecoveryPlan,
  getRecoveryMethods,
  updateRecoveryAction,
  type RecoveryAction,
  type RecoveryMethod,
  type RecoveryPlan,
} from "../api/recovery";

import { getIncidents } from "../api/incidents";

import type { Incident } from "../types";

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return (
        detail[0]?.msg ??
        "Recovery request failed."
      );
    }

    if (!error.response) {
      return "Recovery API is unavailable.";
    }
  }

  return "Something went wrong.";
}

function methodStatus(method: RecoveryMethod) {
  if (
    method.is_available &&
    method.is_verified
  ) {
    return {
      label: "Verified",
      icon: CheckCircle2,
      className:
        "border-emerald-300/[.12] bg-emerald-300/[.045] text-emerald-100/60",
    };
  }

  if (method.is_available) {
    return {
      label: "Available",
      icon: ShieldCheck,
      className:
        "border-cyan-300/[.12] bg-cyan-300/[.045] text-cyan-100/60",
    };
  }

  return {
    label: "Unavailable",
    icon: XCircle,
    className:
      "border-rose-300/[.12] bg-rose-300/[.045] text-rose-100/55",
  };
}

function actionClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "border-emerald-300/[.12] bg-emerald-300/[.04]";

    case "in_progress":
      return "border-violet-300/[.13] bg-violet-300/[.045]";

    case "blocked":
    case "failed":
      return "border-rose-300/[.12] bg-rose-300/[.035]";

    default:
      return "border-white/[.06] bg-white/[.018]";
  }
}

function ActionRow({
  action,
  onStatus,
  updating,
}: {
  action: RecoveryAction;
  onStatus: (
    action: RecoveryAction,
    status: string,
  ) => void;
  updating: string | null;
}) {
  const status =
    action.status.toLowerCase();

  const nextStatus =
    status === "pending"
      ? "in_progress"
      : status === "in_progress"
        ? "completed"
        : null;

  return (
    <motion.div
      layout
      className={`rounded-[20px] border p-4 transition ${actionClass(
        action.status,
      )}`}
    >
      <div className="flex gap-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
            status === "completed"
              ? "border-emerald-300/[.12] bg-emerald-300/[.06]"
              : status === "in_progress"
                ? "border-violet-300/[.13] bg-violet-300/[.06]"
                : "border-white/[.07] bg-white/[.03]"
          }`}
        >
          {status === "completed" ? (
            <Check
              size={14}
              className="text-emerald-200/65"
            />
          ) : status === "in_progress" ? (
            <Activity
              size={14}
              className="text-violet-200/65"
            />
          ) : (
            <span className="text-[10px] font-bold text-white/25">
              {action.step_order}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-white/60">
              {action.title}
            </span>

            <span className="rounded-full bg-white/[.035] px-2 py-1 text-[7px] font-bold uppercase tracking-[.08em] text-white/22">
              {action.action_type}
            </span>
          </div>

          {action.description && (
            <p className="mt-2 text-[9px] leading-5 text-white/23">
              {action.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-[7px] uppercase tracking-[.08em] text-white/18">
              <Clock3 size={9} />
              {action.status}
            </span>

            {action.completed_at && (
              <span className="text-[7px] text-emerald-100/35">
                Completed{" "}
                {new Date(
                  action.completed_at,
                ).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {nextStatus && (
          <button
            disabled={updating === action.id}
            onClick={() =>
              onStatus(
                action,
                nextStatus,
              )
            }
            className="self-center rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2 text-[8px] font-bold text-white/35 transition hover:border-violet-300/[.15] hover:text-white/65 disabled:opacity-40"
          >
            {updating === action.id ? (
              <Loader2
                size={11}
                className="animate-spin"
              />
            ) : (
              nextStatus === "completed"
                ? "Complete"
                : "Start"
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function RecoveryPage() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [methods, setMethods] =
    useState<RecoveryMethod[]>([]);

  const [selectedIncidentId, setSelectedIncidentId] =
    useState<string | null>(null);

  const [plan, setPlan] =
    useState<RecoveryPlan | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [planLoading, setPlanLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [creatingPlan, setCreatingPlan] =
    useState(false);

  const [updatingAction, setUpdatingAction] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const selectedIncident =
    incidents.find(
      (incident) =>
        incident.id ===
        selectedIncidentId,
    ) ?? null;

  const loadRecovery = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          incidentData,
          methodData,
        ] = await Promise.all([
          getIncidents(),
          getRecoveryMethods(),
        ]);

        setIncidents(incidentData);
        setMethods(methodData);

        setSelectedIncidentId(
          (current) =>
            current ??
            incidentData[0]?.id ??
            null,
        );
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadRecovery();
  }, [loadRecovery]);

  const loadPlan = useCallback(
    async (incidentId: string) => {
      setPlanLoading(true);
      setError(null);

      try {
        const existingPlan =
          await getIncidentRecoveryPlan(
            incidentId,
          );

        setPlan(existingPlan);
      } catch (requestError) {
        if (
          axios.isAxiosError(
            requestError,
          ) &&
          requestError.response?.status ===
            404
        ) {
          setPlan(null);
        } else {
          setError(
            getErrorMessage(
              requestError,
            ),
          );
        }
      } finally {
        setPlanLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setPlan(null);

    if (selectedIncidentId) {
      void loadPlan(
        selectedIncidentId,
      );
    }
  }, [
    selectedIncidentId,
    loadPlan,
  ]);

  async function generatePlan() {
    if (!selectedIncident) return;

    setCreatingPlan(true);
    setError(null);

    try {
      const generated =
        await createRecoveryPlan(
          selectedIncident.id,
        );

      setPlan(generated);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setCreatingPlan(false);
    }
  }

  async function changeActionStatus(
    action: RecoveryAction,
    status: string,
  ) {
    setUpdatingAction(action.id);
    setError(null);

    try {
      const updated =
        await updateRecoveryAction(
          action.id,
          status,
        );

      setPlan((current) => {
        if (!current) return current;

        const actions =
          current.actions.map(
            (item) =>
              item.id === updated.id
                ? updated
                : item,
          );

        return {
          ...current,
          actions,
        };
      });

      if (selectedIncidentId) {
        await loadPlan(selectedIncidentId);
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setUpdatingAction(null);
    }
  }

  const verifiedMethods =
    methods.filter(
      (method) =>
        method.is_available &&
        method.is_verified,
    ).length;

  const availableMethods =
    methods.filter(
      (method) =>
        method.is_available,
    ).length;

  const completedActions =
    plan?.actions.filter(
      (action) =>
        action.status.toLowerCase() ===
        "completed",
    ).length ?? 0;

  const actionProgress =
    plan && plan.actions.length
      ? Math.round(
          (completedActions /
            plan.actions.length) *
            100,
        )
      : 0;

  const planStatusLabel =
    plan?.status
      ?.replaceAll("_", " ")
      .toUpperCase() ?? "NO PLAN";

  const methodGroups =
    useMemo(() => {
      const groups =
        new Map<
          string,
          RecoveryMethod[]
        >();

      methods.forEach((method) => {
        const current =
          groups.get(
            method.service_account_id,
          ) ?? [];

        current.push(method);
        groups.set(
          method.service_account_id,
          current,
        );
      });

      return Array.from(
        groups.entries(),
      );
    }, [methods]);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="space-y-5"
    >
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[30px] border border-white/[.07] bg-white/[.024] p-6 backdrop-blur-2xl sm:p-8">
        <div className="absolute -right-28 -top-40 h-[400px] w-[400px] rounded-full bg-cyan-300/[.045] blur-[110px]" />
        <div className="absolute left-[35%] -top-48 h-[380px] w-[380px] rounded-full bg-violet-500/[.055] blur-[110px]" />

        <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-cyan-200/45">
              <ShieldCheck size={13} />
              Recovery intelligence
            </div>

            <h1 className="mt-4 font-[Manrope] text-[34px] font-semibold tracking-[-.055em] text-white/90">
              Recovery.
            </h1>

            <p className="mt-2 max-w-[680px] text-[11px] leading-5 text-white/27">
              Real recovery methods and generated recovery plans
              from your protected database. No simulated recovery
              state is shown here.
            </p>
          </div>

          <button
            onClick={() =>
              void loadRecovery(true)
            }
            disabled={refreshing}
            className="flex items-center justify-center gap-2 self-start rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 py-3 text-[9px] font-bold text-white/35 hover:text-white/65 xl:self-auto"
          >
            <RefreshCw
              size={12}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh recovery
          </button>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [
              "Recovery methods",
              methods.length,
            ],
            [
              "Verified methods",
              verifiedMethods,
            ],
            [
              "Available paths",
              availableMethods,
            ],
            [
              "Active incidents",
              incidents.length,
            ],
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
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div className="h-[620px] animate-pulse rounded-[28px] border border-white/[.06] bg-white/[.018]" />
          <div className="h-[620px] animate-pulse rounded-[28px] border border-white/[.06] bg-white/[.018]" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          {/* LEFT */}
          <section className="space-y-5">
            {/* INCIDIENT SELECTOR */}
            <div className="rounded-[28px] border border-white/[.07] bg-white/[.018] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-white/50">
                    Recovery target
                  </div>

                  <div className="mt-1 text-[8px] text-white/20">
                    Select a real incident
                  </div>
                </div>

                <TriangleAlert
                  size={15}
                  className="text-rose-200/35"
                />
              </div>

              {incidents.length === 0 ? (
                <div className="mt-5 rounded-[17px] border border-dashed border-white/[.07] p-5 text-center">
                  <div className="text-[9px] text-white/25">
                    No incidents available.
                  </div>

                  <div className="mt-1 text-[8px] text-white/15">
                    Create an incident first.
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {incidents.map(
                    (incident) => {
                      const active =
                        incident.id ===
                        selectedIncidentId;

                      return (
                        <button
                          key={incident.id}
                          onClick={() =>
                            setSelectedIncidentId(
                              incident.id,
                            )
                          }
                          className={`w-full rounded-[17px] border p-3 text-left transition ${
                            active
                              ? "border-violet-300/[.15] bg-violet-300/[.045]"
                              : "border-white/[.05] bg-white/[.012] hover:bg-white/[.025]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-rose-300/[.05]">
                              <AlertTriangle
                                size={12}
                                className="text-rose-200/45"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[9px] font-bold text-white/50">
                                {incident.title}
                              </div>

                              <div className="mt-1 text-[7px] uppercase tracking-[.08em] text-white/18">
                                {incident.severity} ·{" "}
                                {incident.status}
                              </div>
                            </div>

                            <ChevronRight
                              size={12}
                              className={
                                active
                                  ? "text-violet-200/55"
                                  : "text-white/12"
                              }
                            />
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {/* METHODS */}
            <div className="rounded-[28px] border border-white/[.07] bg-white/[.018] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-white/50">
                    Recovery methods
                  </div>

                  <div className="mt-1 text-[8px] text-white/20">
                    Real registered recovery paths
                  </div>
                </div>

                <KeyRound
                  size={15}
                  className="text-cyan-200/35"
                />
              </div>

              {methods.length === 0 ? (
                <div className="mt-5 rounded-[17px] border border-dashed border-white/[.07] p-5 text-center">
                  <KeyRound
                    size={18}
                    className="mx-auto text-white/12"
                  />

                  <div className="mt-3 text-[9px] text-white/22">
                    No recovery methods registered.
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {methodGroups.map(
                    ([serviceId, group]) => (
                      <div
                        key={serviceId}
                        className="rounded-[17px] border border-white/[.05] bg-white/[.012] p-3"
                      >
                        <div className="mb-3 text-[7px] uppercase tracking-[.1em] text-white/18">
                          Service {serviceId.slice(
                            0,
                            8,
                          )}
                        </div>

                        <div className="space-y-2">
                          {group.map(
                            (method) => {
                              const state =
                                methodStatus(
                                  method,
                                );

                              const Icon =
                                state.icon;

                              return (
                                <div
                                  key={method.id}
                                  className="flex items-center gap-3"
                                >
                                  <Icon
                                    size={12}
                                    className="shrink-0 text-white/25"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-[9px] font-bold text-white/45">
                                      {method.label}
                                    </div>

                                    <div className="mt-1 text-[7px] text-white/18">
                                      {
                                        method.method_type
                                      }
                                    </div>
                                  </div>

                                  {method.is_primary && (
                                    <span className="rounded-full bg-violet-300/[.06] px-2 py-1 text-[6px] font-bold uppercase tracking-[.08em] text-violet-100/45">
                                      Primary
                                    </span>
                                  )}

                                  <span
                                    className={`rounded-full border px-2 py-1 text-[6px] font-bold uppercase tracking-[.08em] ${state.className}`}
                                  >
                                    {state.label}
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT */}
          <section className="rounded-[30px] border border-white/[.07] bg-white/[.018] p-6 sm:p-7">
            {selectedIncident ? (
              <>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-[.14em] text-violet-200/40">
                      <Sparkles size={11} />
                      Recovery plan
                    </div>

                    <h2 className="mt-3 font-[Manrope] text-[25px] font-semibold tracking-[-.045em] text-white/80">
                      {plan?.title ??
                        "No recovery plan yet"}
                    </h2>

                    <p className="mt-2 max-w-[600px] text-[9px] leading-5 text-white/23">
                      {plan?.summary ??
                        "Generate a recovery plan from the real incident and its dependency context."}
                    </p>
                  </div>

                  {!plan && (
                    <button
                      onClick={() =>
                        void generatePlan()
                      }
                      disabled={creatingPlan}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[9px] font-extrabold text-[#10111a] disabled:opacity-50"
                    >
                      {creatingPlan ? (
                        <>
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Generate recovery plan
                        </>
                      )}
                    </button>
                  )}
                </div>

                {planLoading ? (
                  <div className="mt-7 flex min-h-[400px] items-center justify-center">
                    <Loader2
                      size={22}
                      className="animate-spin text-violet-200/40"
                    />
                  </div>
                ) : plan ? (
                  <>
                    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        [
                          "Plan status",
                          planStatusLabel,
                        ],
                        [
                          "Actions",
                          plan.actions.length,
                        ],
                        [
                          "Completed",
                          completedActions,
                        ],
                        [
                          "Progress",
                          `${actionProgress}%`,
                        ],
                      ].map(
                        ([label, value]) => (
                          <div
                            key={String(
                              label,
                            )}
                            className="rounded-[17px] border border-white/[.055] bg-black/[.08] p-4"
                          >
                            <div className="text-[7px] uppercase tracking-[.1em] text-white/18">
                              {String(
                                label,
                              )}
                            </div>

                            <div className="mt-2 truncate text-[12px] font-bold text-white/55">
                              {String(
                                value,
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    <div className="mt-5 overflow-hidden rounded-full bg-white/[.045]">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${actionProgress}%`,
                        }}
                        transition={{
                          duration: 0.8,
                        }}
                        className="h-1 rounded-full bg-gradient-to-r from-violet-300/80 to-cyan-200/70"
                      />
                    </div>

                    <div className="mt-7">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck2
                            size={14}
                            className="text-violet-200/45"
                          />

                          <span className="text-[10px] font-bold text-white/48">
                            Recovery actions
                          </span>
                        </div>

                        <span className="text-[8px] text-white/18">
                          {completedActions}/
                          {
                            plan.actions
                              .length
                          } complete
                        </span>
                      </div>

                      {plan.actions.length ===
                      0 ? (
                        <div className="rounded-[18px] border border-dashed border-white/[.07] p-8 text-center text-[9px] text-white/20">
                          This plan has no actions.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <AnimatePresence>
                            {plan.actions.map(
                              (action) => (
                                <ActionRow
                                  key={
                                    action.id
                                  }
                                  action={
                                    action
                                  }
                                  onStatus={
                                    changeActionStatus
                                  }
                                  updating={
                                    updatingAction
                                  }
                                />
                              ),
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[17px] border border-white/[.055] bg-white/[.015] p-4">
                        <Zap
                          size={13}
                          className="text-violet-200/40"
                        />

                        <div className="mt-3 text-[8px] text-white/20">
                          Generated
                        </div>

                        <div className="mt-1 text-[9px] text-white/40">
                          {new Date(
                            plan.created_at,
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-[17px] border border-white/[.055] bg-white/[.015] p-4">
                        <Activity
                          size={13}
                          className="text-cyan-200/40"
                        />

                        <div className="mt-3 text-[8px] text-white/20">
                          Updated
                        </div>

                        <div className="mt-1 text-[9px] text-white/40">
                          {new Date(
                            plan.updated_at,
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="rounded-[17px] border border-white/[.055] bg-white/[.015] p-4">
                        <ShieldCheck
                          size={13}
                          className="text-emerald-200/40"
                        />

                        <div className="mt-3 text-[8px] text-white/20">
                          Integrity
                        </div>

                        <div className="mt-1 text-[9px] text-white/40">
                          User-scoped
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-8 flex min-h-[420px] flex-col items-center justify-center rounded-[23px] border border-dashed border-white/[.07] bg-black/[.07] text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-violet-300/[.08] bg-violet-300/[.035]">
                      <Sparkles
                        size={22}
                        className="text-violet-200/40"
                      />
                    </div>

                    <h3 className="mt-5 font-[Manrope] text-[15px] font-semibold text-white/50">
                      Recovery plan not generated
                    </h3>

                    <p className="mt-2 max-w-[390px] text-[9px] leading-5 text-white/20">
                      Generate a plan for this real incident.
                      The backend recovery intelligence service
                      will create the actual recovery actions.
                    </p>

                    <button
                      onClick={() =>
                        void generatePlan()
                      }
                      disabled={creatingPlan}
                      className="mt-6 flex items-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[9px] font-extrabold text-[#10111a] disabled:opacity-50"
                    >
                      {creatingPlan ? (
                        <>
                          <Loader2
                            size={12}
                            className="animate-spin"
                          />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Generate plan
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[600px] flex-col items-center justify-center text-center">
                <ShieldCheck
                  size={25}
                  className="text-white/15"
                />

                <div className="mt-5 text-[11px] text-white/25">
                  Select an incident to view recovery.
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </motion.div>
  );
}
