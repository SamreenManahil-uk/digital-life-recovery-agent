import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  FileCheck2,
  Filter,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
  XCircle,
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
  getAuditEvents,
  type AuditEvent,
  type AuditEventType,
} from "../api/audit";


const EVENT_TYPES: Array<{
  value: AuditEventType | "";
  label: string;
}> = [
  { value: "", label: "All activity" },
  { value: "user_login", label: "Authentication" },
  { value: "user_logout", label: "Sign out" },
  { value: "service_created", label: "Service created" },
  { value: "service_updated", label: "Service updated" },
  { value: "service_deleted", label: "Service deleted" },
  { value: "dependency_created", label: "Dependency created" },
  { value: "dependency_deleted", label: "Dependency deleted" },
  { value: "incident_created", label: "Incident created" },
  { value: "incident_updated", label: "Incident updated" },
  { value: "incident_resolved", label: "Incident resolved" },
  { value: "recovery_plan_created", label: "Recovery plan created" },
  { value: "recovery_plan_updated", label: "Recovery plan updated" },
  { value: "recovery_action_started", label: "Recovery started" },
  { value: "recovery_action_completed", label: "Recovery completed" },
  { value: "recovery_action_failed", label: "Recovery failed" },
  { value: "security_event", label: "Security" },
];


function getEventIcon(type: AuditEventType) {
  if (type === "user_login") return LogIn;
  if (type === "user_logout") return LogOut;

  if (
    type === "service_created" ||
    type === "service_updated" ||
    type === "service_deleted"
  ) {
    return Server;
  }

  if (
    type === "dependency_created" ||
    type === "dependency_deleted"
  ) {
    return Database;
  }

  if (
    type === "incident_created" ||
    type === "incident_updated"
  ) {
    return TriangleAlert;
  }

  if (type === "incident_resolved") {
    return CheckCircle2;
  }

  if (
    type === "recovery_plan_created" ||
    type === "recovery_plan_updated"
  ) {
    return FileCheck2;
  }

  if (type === "recovery_action_started") {
    return Activity;
  }

  if (type === "recovery_action_completed") {
    return ShieldCheck;
  }

  if (type === "recovery_action_failed") {
    return XCircle;
  }

  if (type === "security_event") {
    return ShieldAlert;
  }

  return Activity;
}


function getEventTone(type: AuditEventType) {
  if (
    type === "incident_created" ||
    type === "security_event" ||
    type === "recovery_action_failed"
  ) {
    return {
      icon:
        "border-rose-300/[.13] bg-rose-300/[.06] text-rose-200/65",
      line: "bg-rose-300/20",
      badge:
        "border-rose-300/[.10] bg-rose-300/[.035] text-rose-100/50",
    };
  }

  if (
    type === "incident_resolved" ||
    type === "recovery_action_completed"
  ) {
    return {
      icon:
        "border-emerald-300/[.13] bg-emerald-300/[.055] text-emerald-200/65",
      line: "bg-emerald-300/20",
      badge:
        "border-emerald-300/[.10] bg-emerald-300/[.035] text-emerald-100/50",
    };
  }

  if (
    type === "recovery_plan_created" ||
    type === "recovery_plan_updated" ||
    type === "recovery_action_started"
  ) {
    return {
      icon:
        "border-violet-300/[.13] bg-violet-300/[.055] text-violet-200/65",
      line: "bg-violet-300/20",
      badge:
        "border-violet-300/[.10] bg-violet-300/[.035] text-violet-100/50",
    };
  }

  return {
    icon:
      "border-cyan-300/[.11] bg-cyan-300/[.045] text-cyan-200/60",
    line: "bg-cyan-300/20",
    badge:
      "border-cyan-300/[.10] bg-cyan-300/[.035] text-cyan-100/45",
  };
}


function readableType(type: string) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}


function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(date));
}


function relativeTime(date: string) {
  const seconds = Math.floor(
    (Date.now() -
      new Date(date).getTime()) /
      1000,
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


function metadataEntries(
  metadata: Record<string, unknown> | null,
) {
  if (!metadata) return [];

  return Object.entries(metadata)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        typeof value !== "object",
    )
    .slice(0, 8);
}


function ActivityCard({
  event,
  index,
  selected,
  onSelect,
}: {
  event: AuditEvent;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = getEventIcon(
    event.event_type,
  );

  const tone = getEventTone(
    event.event_type,
  );

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        x: -12,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay: index * 0.025,
        duration: 0.3,
      }}
      className="relative flex gap-4"
    >
      <div className="relative flex w-9 shrink-0 justify-center">
        <div
          className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-[13px] border ${tone.icon}`}
        >
          <Icon size={14} />
        </div>

        <div
          className={`absolute left-1/2 top-9 h-[calc(100%+18px)] w-px -translate-x-1/2 ${tone.line}`}
        />
      </div>

      <button
        onClick={onSelect}
        className={`mb-3 min-w-0 flex-1 rounded-[21px] border p-4 text-left transition ${
          selected
            ? "border-violet-300/[.14] bg-violet-300/[.035]"
            : "border-white/[.055] bg-white/[.015] hover:border-white/[.09] hover:bg-white/[.025]"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-white/58">
                {event.action}
              </span>

              <span
                className={`rounded-full border px-2 py-1 text-[6px] font-bold uppercase tracking-[.09em] ${tone.badge}`}
              >
                {readableType(
                  event.event_type,
                )}
              </span>
            </div>

            {event.description && (
              <p className="mt-2 max-w-[680px] text-[9px] leading-5 text-white/24">
                {event.description}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[8px] font-semibold text-white/27">
              {relativeTime(
                event.created_at,
              )}
            </div>

            <div className="mt-1 text-[7px] text-white/14">
              {formatDate(
                event.created_at,
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[7px] text-white/18">
          <span className="flex items-center gap-1.5">
            <Database size={9} />
            {event.entity_type}
          </span>

          {event.entity_id && (
            <span className="max-w-[230px] truncate">
              {event.entity_id}
            </span>
          )}
        </div>
      </button>
    </motion.div>
  );
}


function EventDetails({
  event,
  onClose,
}: {
  event: AuditEvent;
  onClose: () => void;
}) {
  const metadata =
    metadataEntries(
      event.event_metadata,
    );

  return (
    <motion.aside
      initial={{
        opacity: 0,
        x: 30,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: 30,
      }}
      className="fixed right-0 top-0 z-[100] h-screen w-full max-w-[430px] border-l border-white/[.07] bg-[#0c0d16]/95 p-6 shadow-[-30px_0_100px_rgba(0,0,0,.4)] backdrop-blur-3xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[8px] font-bold uppercase tracking-[.16em] text-violet-200/40">
            Event details
          </div>

          <div className="mt-1 font-[Manrope] text-[17px] font-semibold text-white/70">
            Audit record
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.025] text-white/30 hover:text-white/70"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mt-7 rounded-[21px] border border-white/[.06] bg-white/[.018] p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-[14px] border ${getEventTone(event.event_type).icon}`}
          >
            {(() => {
              const Icon =
                getEventIcon(
                  event.event_type,
                );

              return <Icon size={16} />;
            })()}
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-bold text-white/60">
              {event.action}
            </div>

            <div className="mt-1 text-[7px] uppercase tracking-[.09em] text-white/20">
              {readableType(
                event.event_type,
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {[
          [
            "Entity",
            event.entity_type,
          ],
          [
            "Entity ID",
            event.entity_id ??
              "Not associated",
          ],
          [
            "Created",
            formatDate(
              event.created_at,
            ),
          ],
          [
            "IP address",
            event.ip_address ??
              "Not recorded",
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[16px] border border-white/[.05] bg-white/[.012] p-3"
          >
            <div className="text-[7px] uppercase tracking-[.09em] text-white/15">
              {label}
            </div>

            <div className="mt-1 break-all text-[9px] text-white/38">
              {value}
            </div>
          </div>
        ))}
      </div>

      {event.description && (
        <div className="mt-5">
          <div className="mb-2 text-[8px] font-bold uppercase tracking-[.1em] text-white/20">
            Description
          </div>

          <div className="rounded-[17px] border border-white/[.05] bg-white/[.012] p-4 text-[9px] leading-5 text-white/32">
            {event.description}
          </div>
        </div>
      )}

      {metadata.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-[8px] font-bold uppercase tracking-[.1em] text-white/20">
            Event metadata
          </div>

          <div className="space-y-2">
            {metadata.map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 rounded-[14px] border border-white/[.05] bg-white/[.012] px-3 py-2.5"
                >
                  <span className="text-[7px] text-white/18">
                    {key.replaceAll(
                      "_",
                      " ",
                    )}
                  </span>

                  <span className="max-w-[210px] truncate text-right text-[8px] text-white/35">
                    {String(value)}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {event.user_agent && (
        <div className="mt-5">
          <div className="mb-2 text-[8px] font-bold uppercase tracking-[.1em] text-white/20">
            Client
          </div>

          <div className="rounded-[16px] border border-white/[.05] bg-white/[.012] p-3 text-[7px] leading-4 text-white/20">
            {event.user_agent}
          </div>
        </div>
      )}
    </motion.aside>
  );
}


export default function ActivityPage() {
  const [events, setEvents] =
    useState<AuditEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedType, setSelectedType] =
    useState<AuditEventType | "">("");

  const [entityFilter, setEntityFilter] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedEvent, setSelectedEvent] =
    useState<AuditEvent | null>(null);

  const [showFilters, setShowFilters] =
    useState(false);

  const loadEvents = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data =
          await getAuditEvents({
            limit: 100,
            event_type:
              selectedType || undefined,
            entity_type:
              entityFilter.trim() ||
              undefined,
          });

        setEvents(data);
      } catch (requestError) {
        if (
          axios.isAxiosError(
            requestError,
          ) &&
          !requestError.response
        ) {
          setError(
            "Unable to connect to the Recovery API.",
          );
        } else {
          setError(
            "Unable to load activity.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      selectedType,
      entityFilter,
    ],
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void loadEvents();
      },
      entityFilter ? 250 : 0,
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    loadEvents,
  ]);

  const filteredEvents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) return events;

      return events.filter(
        (event) =>
          event.action
            .toLowerCase()
            .includes(query) ||
          event.event_type
            .toLowerCase()
            .includes(query) ||
          event.entity_type
            .toLowerCase()
            .includes(query) ||
          event.description
            ?.toLowerCase()
            .includes(query),
      );
    }, [
      events,
      search,
    ]);

  const stats = useMemo(() => {
    return {
      total: events.length,

      incidents: events.filter(
        (event) =>
          event.event_type.startsWith(
            "incident_",
          ),
      ).length,

      recovery: events.filter(
        (event) =>
          event.event_type.startsWith(
            "recovery_",
          ),
      ).length,

      security: events.filter(
        (event) =>
          event.event_type ===
          "security_event",
      ).length,
    };
  }, [events]);

  const clearFilters = () => {
    setSelectedType("");
    setEntityFilter("");
    setSearch("");
  };

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
        <div className="absolute -right-32 -top-44 h-[430px] w-[430px] rounded-full bg-violet-400/[.055] blur-[115px]" />
        <div className="absolute left-[32%] -bottom-56 h-[400px] w-[400px] rounded-full bg-cyan-300/[.035] blur-[110px]" />

        <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-violet-200/45">
              <Activity size={13} />
              Digital activity intelligence
            </div>

            <h1 className="mt-4 font-[Manrope] text-[34px] font-semibold tracking-[-.055em] text-white/90">
              Activity.
            </h1>

            <p className="mt-2 max-w-[680px] text-[11px] leading-5 text-white/27">
              A real audit timeline of actions performed
              across your protected digital recovery system.
            </p>
          </div>

          <button
            onClick={() =>
              void loadEvents(true)
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
            Refresh activity
          </button>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [
              "Recorded events",
              stats.total,
              Activity,
            ],
            [
              "Incident events",
              stats.incidents,
              TriangleAlert,
            ],
            [
              "Recovery events",
              stats.recovery,
              FileCheck2,
            ],
            [
              "Security events",
              stats.security,
              ShieldAlert,
            ],
          ].map(
            ([label, value, Icon]) => (
              <div
                key={String(label)}
                className="rounded-[18px] border border-white/[.06] bg-black/[.08] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[8px] text-white/22">
                    {String(label)}
                  </div>

                  {typeof Icon ===
                    "function" && (
                    <Icon
                      size={13}
                      className="text-white/15"
                    />
                  )}
                </div>

                <div className="mt-2 font-[Manrope] text-[22px] font-semibold text-white/70">
                  {String(value)}
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* CONTROLS */}
      <section className="rounded-[24px] border border-white/[.07] bg-white/[.018] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search activity..."
              className="h-11 w-full rounded-[15px] border border-white/[.06] bg-black/[.10] pl-10 pr-4 text-[9px] text-white/60 outline-none placeholder:text-white/18 focus:border-violet-300/[.14]"
            />
          </div>

          <button
            onClick={() =>
              setShowFilters(
                (current) =>
                  !current,
              )
            }
            className={`flex h-11 items-center justify-center gap-2 rounded-[15px] border px-4 text-[9px] font-bold transition ${
              showFilters
                ? "border-violet-300/[.14] bg-violet-300/[.04] text-violet-100/60"
                : "border-white/[.06] bg-white/[.018] text-white/30"
            }`}
          >
            <Filter size={12} />
            Filters
            <ChevronDown
              size={11}
              className={
                showFilters
                  ? "rotate-180 transition"
                  : "transition"
              }
            />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid gap-3 border-t border-white/[.05] pt-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[7px] font-bold uppercase tracking-[.1em] text-white/18">
                    Event type
                  </label>

                  <select
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(
                        event.target
                          .value as AuditEventType | "",
                      )
                    }
                    className="h-10 w-full rounded-[13px] border border-white/[.06] bg-[#11121d] px-3 text-[9px] text-white/40 outline-none"
                  >
                    {EVENT_TYPES.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[7px] font-bold uppercase tracking-[.1em] text-white/18">
                    Entity type
                  </label>

                  <input
                    value={entityFilter}
                    onChange={(event) =>
                      setEntityFilter(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. incident, service"
                    className="h-10 w-full rounded-[13px] border border-white/[.06] bg-black/[.10] px-3 text-[9px] text-white/45 outline-none placeholder:text-white/15"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(selectedType ||
          entityFilter ||
          search) && (
          <div className="mt-3 flex items-center justify-between border-t border-white/[.05] pt-3">
            <span className="text-[8px] text-white/18">
              Showing{" "}
              {filteredEvents.length} of{" "}
              {events.length} events
            </span>

            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-[8px] font-bold text-white/25 hover:text-white/55"
            >
              <X size={10} />
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-3 rounded-[17px] border border-rose-300/[.10] bg-rose-300/[.035] px-4 py-3 text-[9px] text-rose-100/55">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {/* TIMELINE */}
      <section className="rounded-[28px] border border-white/[.07] bg-white/[.018] p-5 sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock3
                size={14}
                className="text-violet-200/40"
              />

              <span className="text-[10px] font-bold text-white/48">
                Timeline
              </span>
            </div>

            <div className="mt-1 text-[8px] text-white/18">
              Latest protected-system activity
            </div>
          </div>

          <div className="hidden items-center gap-2 text-[7px] text-white/15 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/55" />
            User-scoped audit trail
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-[100px] animate-pulse rounded-[21px] border border-white/[.05] bg-white/[.012]"
                />
              ),
            )}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex min-h-[390px] flex-col items-center justify-center rounded-[22px] border border-dashed border-white/[.07] bg-black/[.06] text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/[.07] bg-white/[.025]">
              <Activity
                size={21}
                className="text-white/15"
              />
            </div>

            <div className="mt-5 font-[Manrope] text-[14px] font-semibold text-white/38">
              No activity found
            </div>

            <p className="mt-2 max-w-[380px] text-[9px] leading-5 text-white/18">
              There are no audit events matching the
              current filters. Real events will appear here
              when actions are recorded by the backend.
            </p>

            {(selectedType ||
              entityFilter ||
              search) && (
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-2 text-[8px] font-bold text-white/30 hover:text-white/60"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {filteredEvents.map(
              (event, index) => (
                <ActivityCard
                  key={event.id}
                  event={event}
                  index={index}
                  selected={
                    selectedEvent?.id ===
                    event.id
                  }
                  onSelect={() =>
                    setSelectedEvent(
                      event,
                    )
                  }
                />
              ),
            )}
          </div>
        )}
      </section>

      {/* FOOTER INFO */}
      <section className="grid gap-3 md:grid-cols-3">
        {[
          [
            KeyRound,
            "User scoped",
            "Only your authenticated audit records are returned.",
          ],
          [
            ShieldCheck,
            "Protected",
            "Audit records are read through the authenticated API.",
          ],
          [
            ArrowDownToLine,
            "Traceable",
            "Each event retains its action, entity and timestamp.",
          ],
        ].map(
          ([Icon, title, description]) => (
            <div
              key={String(title)}
              className="rounded-[20px] border border-white/[.055] bg-white/[.014] p-4"
            >
              {typeof Icon ===
                "function" && (
                <Icon
                  size={14}
                  className="text-white/22"
                />
              )}

              <div className="mt-3 text-[9px] font-bold text-white/35">
                {String(title)}
              </div>

              <div className="mt-1 text-[8px] leading-4 text-white/17">
                {String(
                  description,
                )}
              </div>
            </div>
          ),
        )}
      </section>

      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setSelectedEvent(null)
              }
              className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[2px]"
            />

            <EventDetails
              event={selectedEvent}
              onClose={() =>
                setSelectedEvent(null)
              }
            />
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
