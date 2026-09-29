import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { getServices } from "../api/services";

import {
  createRecoveryMethod,
  deleteRecoveryMethod,
  getRecoveryMethods,
  updateRecoveryMethod,
  type RecoveryMethod,
  type RecoveryMethodType,
} from "../api/recoveryMethods";

const methodOptions: Array<{
  value: RecoveryMethodType;
  label: string;
}> = [
  {
    value: "recovery_email",
    label: "Recovery email",
  },
  {
    value: "phone_number",
    label: "Phone number",
  },
  {
    value: "authenticator_app",
    label: "Authenticator app",
  },
  {
    value: "backup_codes",
    label: "Backup codes",
  },
  {
    value: "trusted_device",
    label: "Trusted device",
  },
  {
    value: "security_key",
    label: "Security key",
  },
  {
    value: "support_process",
    label: "Support process",
  },
  {
    value: "other",
    label: "Other",
  },
];

function getMethodLabel(
  type: RecoveryMethodType,
) {
  return (
    methodOptions.find(
      (option) => option.value === type,
    )?.label ?? type
  );
}

export default function RecoveryMethodsPage() {
  const [methods, setMethods] =
    useState<RecoveryMethod[]>([]);

  const [services, setServices] =
    useState<
      Array<{
        id: string;
        name: string;
        provider?: string | null;
      }>
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [serviceId, setServiceId] =
    useState("");

  const [methodType, setMethodType] =
    useState<RecoveryMethodType>(
      "recovery_email",
    );

  const [label, setLabel] =
    useState("");

  const [available, setAvailable] =
    useState(true);

  const [verified, setVerified] =
    useState(false);

  const [primary, setPrimary] =
    useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [
        recoveryData,
        serviceData,
      ] = await Promise.all([
        getRecoveryMethods(),
        getServices(),
      ]);

      setMethods(recoveryData);
      setServices(serviceData);

      if (
        serviceData.length > 0
      ) {
        setServiceId(
          (current) =>
            current ||
            serviceData[0].id,
        );
      }
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Unable to load recovery methods.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const serviceMap = useMemo(
    () =>
      new Map(
        services.map(
          (service) => [
            service.id,
            service,
          ],
        ),
      ),
    [services],
  );

  const verifiedCount =
    methods.filter(
      (method) =>
        method.is_verified,
    ).length;

  const availableCount =
    methods.filter(
      (method) =>
        method.is_available,
    ).length;

  const primaryCount =
    methods.filter(
      (method) =>
        method.is_primary,
    ).length;

  async function handleCreate(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!serviceId) {
      setError(
        "Please select a digital asset.",
      );
      return;
    }

    if (!label.trim()) {
      setError(
        "Please enter a label.",
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createRecoveryMethod({
        service_account_id:
          serviceId,
        method_type:
          methodType,
        label: label.trim(),
        is_available:
          available,
        is_verified:
          verified,
        is_primary:
          primary,
      });

      setDrawerOpen(false);
      setLabel("");
      setMethodType(
        "recovery_email",
      );
      setAvailable(true);
      setVerified(false);
      setPrimary(false);

      await loadData();
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Unable to create recovery method.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(
    method: RecoveryMethod,
    field:
      | "is_available"
      | "is_verified"
      | "is_primary",
  ) {
    try {
      setError(null);

      await updateRecoveryMethod(
        method.id,
        {
          [field]:
            !method[field],
        },
      );

      await loadData();
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Unable to update recovery method.",
      );
    }
  }

  async function handleDelete(
    method: RecoveryMethod,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${method.label}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteRecoveryMethod(
        method.id,
      );

      await loadData();
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Unable to delete recovery method.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-violet-200/45">
            <KeyRound size={14} />
            Recovery Security
          </div>

          <h1 className="text-3xl font-semibold tracking-[-.04em] text-white/90">
            Recovery Methods
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/30">
            Manage safe recovery paths
            for your digital assets
            without storing passwords
            or authentication secrets.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setDrawerOpen(true)
          }
          disabled={
            services.length === 0
          }
          className="flex items-center gap-2 rounded-2xl border border-violet-300/15 bg-violet-300/[.08] px-4 py-3 text-xs font-bold text-violet-100 transition hover:bg-violet-300/[.14] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={15} />
          Add Recovery Method
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Recovery Methods",
            methods.length,
          ],
          [
            "Verified",
            verifiedCount,
          ],
          [
            "Available",
            availableCount,
          ],
          [
            "Primary",
            primaryCount,
          ],
        ].map(
          ([title, value]) => (
            <div
              key={String(title)}
              className="rounded-[22px] border border-white/[.06] bg-white/[.025] p-5"
            >
              <div className="text-[9px] font-bold uppercase tracking-[.16em] text-white/25">
                {title}
              </div>

              <div className="mt-3 text-2xl font-semibold text-white/80">
                {value}
              </div>
            </div>
          ),
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-300/10 bg-rose-400/[.06] px-4 py-3 text-xs text-rose-100/70">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Loader2
            size={22}
            className="animate-spin text-violet-200/50"
          />
        </div>
      ) : methods.length === 0 ? (
        <div className="rounded-[28px] border border-white/[.06] bg-white/[.02] p-10 text-center">
          <ShieldCheck
            size={30}
            className="mx-auto text-violet-200/30"
          />

          <h2 className="mt-4 text-sm font-semibold text-white/65">
            No recovery methods
            registered
          </h2>

          <p className="mt-2 text-xs text-white/25">
            Add your first recovery
            path to improve recovery
            readiness.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {methods.map(
            (method) => {
              const service =
                serviceMap.get(
                  method.service_account_id,
                );

              return (
                <div
                  key={method.id}
                  className="rounded-[24px] border border-white/[.06] bg-white/[.025] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-[.14em] text-violet-200/45">
                        {getMethodLabel(
                          method.method_type,
                        )}
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-white/75">
                        {method.label}
                      </h3>

                      <p className="mt-1 text-[10px] text-white/25">
                        {service?.name ??
                          "Unknown asset"}

                        {service?.provider
                          ? ` · ${service.provider}`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(
                          method,
                        )
                      }
                      className="rounded-xl border border-rose-300/10 bg-rose-400/[.04] p-2 text-rose-200/40 transition hover:text-rose-200"
                    >
                      <Trash2
                        size={13}
                      />
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void toggleStatus(
                          method,
                          "is_available",
                        )
                      }
                      className={`rounded-xl border px-2 py-2.5 text-[9px] font-bold transition ${
                        method.is_available
                          ? "border-emerald-300/10 bg-emerald-300/[.06] text-emerald-100/65"
                          : "border-white/[.05] bg-white/[.02] text-white/25"
                      }`}
                    >
                      {method.is_available
                        ? "✓ "
                        : ""}
                      Available
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleStatus(
                          method,
                          "is_verified",
                        )
                      }
                      className={`rounded-xl border px-2 py-2.5 text-[9px] font-bold transition ${
                        method.is_verified
                          ? "border-cyan-300/10 bg-cyan-300/[.06] text-cyan-100/65"
                          : "border-white/[.05] bg-white/[.02] text-white/25"
                      }`}
                    >
                      {method.is_verified
                        ? "✓ "
                        : ""}
                      Verified
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void toggleStatus(
                          method,
                          "is_primary",
                        )
                      }
                      className={`rounded-xl border px-2 py-2.5 text-[9px] font-bold transition ${
                        method.is_primary
                          ? "border-amber-300/10 bg-amber-300/[.06] text-amber-100/65"
                          : "border-white/[.05] bg-white/[.02] text-white/25"
                      }`}
                    >
                      {method.is_primary && (
                        <Star
                          size={9}
                          className="mr-1 inline"
                        />
                      )}
                      Primary
                    </button>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() =>
              setDrawerOpen(false)
            }
            className="absolute inset-0"
          />

          <aside className="relative z-10 h-full w-full max-w-[470px] overflow-y-auto border-l border-white/[.07] bg-[#080b16] p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.18em] text-violet-200/45">
                  Recovery Security
                </div>

                <h2 className="mt-2 text-xl font-semibold text-white/85">
                  Add Recovery Method
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDrawerOpen(false)
                }
                className="rounded-xl border border-white/[.07] bg-white/[.03] p-2 text-white/40"
              >
                <X size={15} />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.14em] text-white/30">
                  Digital Asset
                </span>

                <select
                  value={serviceId}
                  onChange={(event) =>
                    setServiceId(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-white/[.07] bg-[#111522] px-4 py-3 text-sm text-white outline-none"
                >
                  {services.map(
                    (service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.14em] text-white/30">
                  Method Type
                </span>

                <select
                  value={methodType}
                  onChange={(event) =>
                    setMethodType(
                      event.target
                        .value as RecoveryMethodType,
                    )
                  }
                  className="w-full rounded-2xl border border-white/[.07] bg-[#111522] px-4 py-3 text-sm text-white outline-none"
                >
                  {methodOptions.map(
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
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.14em] text-white/30">
                  Label
                </span>

                <input
                  value={label}
                  onChange={(event) =>
                    setLabel(
                      event.target.value,
                    )
                  }
                  maxLength={150}
                  placeholder="e.g. Google recovery email configured"
                  className="w-full rounded-2xl border border-white/[.07] bg-[#111522] px-4 py-3 text-sm text-white outline-none placeholder:text-white/15"
                />

                <p className="mt-2 text-[9px] leading-4 text-white/20">
                  Do not enter an actual
                  password, recovery code,
                  private key or
                  authenticator secret.
                </p>
              </label>

              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.02] p-3">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(event) =>
                      setAvailable(
                        event.target.checked,
                      )
                    }
                  />

                  <div>
                    <div className="text-[10px] font-bold text-white/60">
                      Available
                    </div>

                    <div className="text-[8px] text-white/20">
                      This recovery path can
                      currently be used.
                    </div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.02] p-3">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(event) =>
                      setVerified(
                        event.target.checked,
                      )
                    }
                  />

                  <div>
                    <div className="text-[10px] font-bold text-white/60">
                      Verified
                    </div>

                    <div className="text-[8px] text-white/20">
                      You have confirmed this
                      method is valid.
                    </div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.02] p-3">
                  <input
                    type="checkbox"
                    checked={primary}
                    onChange={(event) =>
                      setPrimary(
                        event.target.checked,
                      )
                    }
                  />

                  <div>
                    <div className="text-[10px] font-bold text-white/60">
                      Primary
                    </div>

                    <div className="text-[8px] text-white/20">
                      Preferred recovery
                      method for this asset.
                    </div>
                  </div>
                </label>
              </div>

              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[.04] p-4">
                <div className="flex gap-2">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-200/55"
                  />

                  <p className="text-[9px] leading-5 text-emerald-50/40">
                    Only recovery metadata
                    is stored. The secret
                    itself should remain
                    outside this platform.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-300 px-4 py-3 text-xs font-bold text-[#10111d] transition hover:brightness-110 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={14}
                  />
                )}

                Save Recovery Method
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
