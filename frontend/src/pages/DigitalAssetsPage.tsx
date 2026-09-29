import axios from "axios";

import {
  Boxes,
  Check,
  Cloud,
  Code2,
  CreditCard,
  Database,
  Edit3,
  HardDrive,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
  X,
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

import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "../api/services";

import type {
  ServiceAccount,
  ServiceCreate,
  ServiceType,
} from "../types";

const serviceTypes: {
  value: ServiceType;
  label: string;
}[] = [
  {
    value: "email",
    label: "Email",
  },
  {
    value: "device",
    label: "Device",
  },
  {
    value: "developer",
    label: "Developer",
  },
  {
    value: "cloud",
    label: "Cloud",
  },
  {
    value: "storage",
    label: "Storage",
  },
  {
    value: "communication",
    label: "Communication",
  },
  {
    value: "social",
    label: "Social",
  },
  {
    value: "financial",
    label: "Financial",
  },
  {
    value: "other",
    label: "Other",
  },
];

const serviceIcons = {
  email: Mail,
  device: Smartphone,
  social: Users,
  developer: Code2,
  cloud: Cloud,
  financial: CreditCard,
  storage: HardDrive,
  communication: MessageCircle,
  other: Database,
};

function errorMessage(
  error: unknown,
) {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (
      Array.isArray(detail) &&
      detail.length
    ) {
      return (
        detail[0]?.msg ??
        "Please check the form."
      );
    }

    if (!error.response) {
      return "Unable to reach the LifeGraph API.";
    }
  }

  return "Something went wrong.";
}

function criticalityLabel(
  value: number,
) {
  if (value >= 5) {
    return "Critical";
  }

  if (value >= 4) {
    return "High";
  }

  if (value >= 3) {
    return "Important";
  }

  if (value >= 2) {
    return "Moderate";
  }

  return "Low";
}

function AssetModal({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceAccount | null;
  onClose: () => void;
  onSaved: (
    service: ServiceAccount,
  ) => void;
}) {
  const [name, setName] =
    useState(service?.name ?? "");

  const [provider, setProvider] =
    useState(
      service?.provider ?? "",
    );

  const [serviceType, setServiceType] =
    useState<ServiceType>(
      service?.service_type ??
        "email",
    );

  const [criticality, setCriticality] =
    useState(
      service?.criticality ?? 3,
    );

  const [description, setDescription] =
    useState(
      service?.description ?? "",
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    const payload: ServiceCreate = {
      name: name.trim(),
      provider:
        provider.trim(),
      service_type: serviceType,
      criticality,
      description:
        description.trim() || null,
    };

    try {
      const result = service
        ? await updateService(
            service.id,
            payload,
          )
        : await createService(
            payload,
          );

      onSaved(result);
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#05050c]/70 px-4 backdrop-blur-md"
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 15,
          scale: 0.97,
        }}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/[.1] bg-[#11121d]/95 shadow-[0_40px_120px_rgba(0,0,0,.65)] backdrop-blur-3xl"
      >
        <div className="relative border-b border-white/[.06] p-6">
          <div className="absolute -right-16 -top-24 h-[220px] w-[220px] rounded-full bg-violet-500/[.12] blur-[70px]" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[9px] font-extrabold uppercase tracking-[.18em] text-violet-200/40">
                Digital identity
              </div>

              <h2 className="mt-2 font-[Manrope] text-[24px] font-semibold tracking-[-.04em] text-white/90">
                {service
                  ? "Edit digital asset"
                  : "Add digital asset"}
              </h2>

              <p className="mt-1 text-[10px] text-white/25">
                Store recovery metadata,
                never passwords or
                private secrets.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.03] text-white/30 transition hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
                Service name
              </span>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                required
                maxLength={150}
                placeholder="e.g. Gmail"
                className="h-[50px] w-full rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 text-[12px] text-white/75 outline-none transition placeholder:text-white/15 focus:border-violet-300/25"
              />
            </label>

            <label>
              <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
                Provider
              </span>

              <input
                value={provider}
                onChange={(event) =>
                  setProvider(
                    event.target.value,
                  )
                }
                required
                maxLength={150}
                placeholder="e.g. Google"
                className="h-[50px] w-full rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 text-[12px] text-white/75 outline-none transition placeholder:text-white/15 focus:border-violet-300/25"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Service type
            </span>

            <select
              value={serviceType}
              onChange={(event) =>
                setServiceType(
                  event.target
                    .value as ServiceType,
                )
              }
              className="h-[50px] w-full rounded-[15px] border border-white/[.07] bg-[#151622] px-4 text-[12px] text-white/70 outline-none focus:border-violet-300/25"
            >
              {serviceTypes.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
                Criticality
              </span>

              <span className="rounded-full border border-violet-300/[.1] bg-violet-300/[.05] px-2.5 py-1 text-[9px] font-bold text-violet-100/55">
                {criticality}/5 ·{" "}
                {criticalityLabel(
                  criticality,
                )}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      setCriticality(
                        value,
                      )
                    }
                    className={`h-10 rounded-[12px] border text-[10px] font-bold transition ${
                      criticality ===
                      value
                        ? "border-violet-300/30 bg-violet-300/[.12] text-violet-100"
                        : "border-white/[.06] bg-white/[.025] text-white/25 hover:bg-white/[.05]"
                    }`}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="What role does this service play in your digital life?"
              className="w-full resize-none rounded-[15px] border border-white/[.07] bg-white/[.025] px-4 py-3 text-[12px] leading-5 text-white/70 outline-none transition placeholder:text-white/15 focus:border-violet-300/25"
            />
          </label>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="rounded-[14px] border border-rose-300/[.12] bg-rose-300/[.05] px-4 py-3 text-[10px] text-rose-100/65"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] border border-white/[.07] px-4 py-3 text-[10px] font-bold text-white/30 transition hover:text-white/60"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="flex min-w-[145px] items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3 text-[10px] font-extrabold text-[#10111a] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check size={13} />
                  {service
                    ? "Save changes"
                    : "Add asset"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DigitalAssetsPage() {
  const [services, setServices] =
    useState<ServiceAccount[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<ServiceType | "all">(
      "all",
    );

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingService,
    setEditingService,
  ] =
    useState<ServiceAccount | null>(
      null,
    );

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<string | null>(null);

  const loadServices =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await getServices();

        setServices(result);
      } catch (requestError) {
        setError(
          errorMessage(
            requestError,
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const filteredServices =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLowerCase();

      return services.filter(
        (service) => {
          const matchesType =
            filter === "all" ||
            service.service_type ===
              filter;

          const matchesQuery =
            !normalized ||
            [
              service.name,
              service.provider,
              service.description ??
                "",
              service.service_type,
            ]
              .join(" ")
              .toLowerCase()
              .includes(
                normalized,
              );

          return (
            matchesType &&
            matchesQuery
          );
        },
      );
    }, [
      services,
      query,
      filter,
    ]);

  const criticalCount =
    services.filter(
      (service) =>
        service.criticality >= 4,
    ).length;

  async function removeService(
    service: ServiceAccount,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${service.name}? This cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(service.id);

    try {
      await deleteService(
        service.id,
      );

      setServices((current) =>
        current.filter(
          (item) =>
            item.id !== service.id,
        ),
      );
    } catch (requestError) {
      window.alert(
        errorMessage(
          requestError,
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="space-y-6"
    >
      <section className="relative overflow-hidden rounded-[30px] border border-white/[.07] bg-white/[.025] p-6 backdrop-blur-2xl sm:p-8">
        <div className="absolute -right-20 -top-28 h-[300px] w-[300px] rounded-full bg-violet-500/[.09] blur-[90px]" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-violet-200/40">
              <Boxes size={13} />
              Digital inventory
            </div>

            <h1 className="mt-4 font-[Manrope] text-[34px] font-semibold tracking-[-.055em] text-white/90">
              Your digital assets.
            </h1>

            <p className="mt-2 max-w-[570px] text-[11px] leading-5 text-white/27">
              Map the services,
              identities and devices
              your digital life depends
              on.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingService(null);
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-violet-200 via-white to-cyan-100 px-5 py-3.5 text-[10px] font-extrabold text-[#10111a] shadow-[0_14px_40px_rgba(139,92,246,.12)] transition hover:-translate-y-0.5"
          >
            <Plus size={14} />
            Add digital asset
          </button>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:max-w-[580px] lg:grid-cols-3">
          {[
            [
              "Total assets",
              services.length,
            ],
            [
              "High criticality",
              criticalCount,
            ],
            [
              "Protected",
              services.filter(
                (service) =>
                  service.is_active,
              ).length,
            ],
          ].map(
            ([label, value]) => (
              <div
                key={String(label)}
                className="rounded-[18px] border border-white/[.06] bg-black/[.08] p-4"
              >
                <div className="text-[9px] text-white/22">
                  {String(label)}
                </div>

                <div className="mt-2 font-[Manrope] text-[23px] font-semibold text-white/75">
                  {String(value)}
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="rounded-[26px] border border-white/[.065] bg-white/[.018] p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-[390px]">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search assets..."
              className="h-[46px] w-full rounded-[15px] border border-white/[.06] bg-white/[.025] pl-11 pr-4 text-[11px] text-white/65 outline-none placeholder:text-white/17 focus:border-violet-300/20"
            />
          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target
                  .value as
                  | ServiceType
                  | "all",
              )
            }
            className="h-[46px] rounded-[15px] border border-white/[.06] bg-[#151622] px-4 text-[10px] text-white/50 outline-none"
          >
            <option value="all">
              All service types
            </option>

            {serviceTypes.map(
              (type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ),
            )}
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <div
                key={item}
                className="h-[220px] animate-pulse rounded-[25px] border border-white/[.05] bg-white/[.02]"
              />
            ),
          )}
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-rose-300/[.1] bg-rose-300/[.04] p-8 text-center">
          <div className="text-[12px] font-bold text-rose-100/65">
            {error}
          </div>

          <button
            onClick={() =>
              void loadServices()
            }
            className="mt-4 rounded-xl border border-white/[.07] px-4 py-2 text-[9px] font-bold text-white/40"
          >
            Try again
          </button>
        </div>
      ) : filteredServices.length ===
        0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[.08] bg-white/[.012]">
          <div className="flex h-14 w-14 items-center justify-center rounded-[19px] border border-violet-300/[.1] bg-violet-300/[.045]">
            <Boxes
              size={20}
              className="text-violet-200/45"
            />
          </div>

          <h3 className="mt-5 font-[Manrope] text-[17px] font-semibold text-white/65">
            {services.length === 0
              ? "Your dependency map starts here."
              : "No matching assets."}
          </h3>

          <p className="mt-2 text-[10px] text-white/22">
            {services.length === 0
              ? "Add your first digital service or device."
              : "Try another search or filter."}
          </p>

          {services.length === 0 && (
            <button
              onClick={() => {
                setEditingService(
                  null,
                );
                setModalOpen(true);
              }}
              className="mt-5 flex items-center gap-2 rounded-[14px] border border-violet-300/[.12] bg-violet-300/[.05] px-4 py-3 text-[9px] font-bold text-violet-100/60"
            >
              <Plus size={12} />
              Add first asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map(
            (service, index) => {
              const Icon =
                serviceIcons[
                  service
                    .service_type
                ];

              return (
                <motion.article
                  key={service.id}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay:
                      index * 0.04,
                  }}
                  whileHover={{
                    y: -4,
                  }}
                  className="group relative overflow-hidden rounded-[25px] border border-white/[.07] bg-[#11121d]/55 p-5 shadow-[0_20px_50px_rgba(0,0,0,.16)] backdrop-blur-2xl"
                >
                  <div className="absolute -right-14 -top-16 h-[150px] w-[150px] rounded-full bg-violet-400/[.055] blur-[55px]" />

                  <div className="relative flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-white/[.07] bg-gradient-to-br from-violet-300/[.09] to-cyan-300/[.025]">
                      <Icon
                        size={18}
                        className="text-violet-100/55"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        title="Edit asset"
                        onClick={() => {
                          setEditingService(
                            service,
                          );
                          setModalOpen(
                            true,
                          );
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:bg-white/[.05] hover:text-white/60"
                      >
                        <Edit3
                          size={13}
                        />
                      </button>

                      <button
                        title="Delete asset"
                        disabled={
                          deletingId ===
                          service.id
                        }
                        onClick={() =>
                          void removeService(
                            service,
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:bg-rose-300/[.06] hover:text-rose-200/65"
                      >
                        {deletingId ===
                        service.id ? (
                          <MoreHorizontal
                            size={13}
                          />
                        ) : (
                          <Trash2
                            size={13}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative mt-5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-[Manrope] text-[16px] font-semibold tracking-[-.03em] text-white/75">
                        {service.name}
                      </h3>

                      {service.is_active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_rgba(110,231,183,.55)]" />
                      )}
                    </div>

                    <div className="mt-1 text-[9px] text-white/22">
                      {service.provider} ·{" "}
                      {
                        service.service_type
                      }
                    </div>

                    <p className="mt-4 min-h-[38px] text-[10px] leading-[18px] text-white/27">
                      {service.description ||
                        "No description added yet."}
                    </p>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-white/[.055] pt-4">
                    <div>
                      <div className="text-[8px] font-bold uppercase tracking-[.12em] text-white/18">
                        Criticality
                      </div>

                      <div className="mt-1 text-[10px] font-bold text-white/48">
                        {
                          service.criticality
                        }
                        /5 ·{" "}
                        {criticalityLabel(
                          service.criticality,
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-emerald-300/[.08] bg-emerald-300/[.035] px-2.5 py-1.5">
                      <ShieldCheck
                        size={10}
                        className="text-emerald-200/50"
                      />

                      <span className="text-[8px] font-bold text-emerald-100/45">
                        {service.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            },
          )}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <AssetModal
            service={
              editingService
            }
            onClose={() => {
              setModalOpen(false);
              setEditingService(
                null,
              );
            }}
            onSaved={(
              savedService,
            ) => {
              setServices(
                (current) => {
                  const exists =
                    current.some(
                      (service) =>
                        service.id ===
                        savedService.id,
                    );

                  if (exists) {
                    return current.map(
                      (service) =>
                        service.id ===
                        savedService.id
                          ? savedService
                          : service,
                    );
                  }

                  return [
                    savedService,
                    ...current,
                  ];
                },
              );

              setModalOpen(false);
              setEditingService(
                null,
              );
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
