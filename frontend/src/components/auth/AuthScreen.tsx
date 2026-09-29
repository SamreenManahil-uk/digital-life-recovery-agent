import axios from "axios";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Mail,
  Network,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  useState,
  type FormEvent,
} from "react";

import { useAuth } from "../../context/AuthContext";

type Mode = "login" | "register";

function DependencyVisual() {
  return (
    <div className="relative mx-auto mt-10 h-[280px] w-full max-w-[520px]">
      <div className="absolute left-[10%] top-[45%] h-px w-[28%] origin-left rotate-[-18deg] bg-gradient-to-r from-violet-300/10 via-violet-300/55 to-cyan-200/20" />

      <div className="absolute left-[36%] top-[35%] h-px w-[28%] origin-left rotate-[19deg] bg-gradient-to-r from-violet-300/15 via-cyan-200/45 to-violet-300/15" />

      <div className="absolute left-[61%] top-[46%] h-px w-[24%] origin-left rotate-[-18deg] bg-gradient-to-r from-cyan-200/10 via-violet-300/45 to-violet-300/10" />

      {[
        {
          icon: Smartphone,
          label: "Device",
          left: "4%",
          top: "47%",
          delay: 0,
        },
        {
          icon: Mail,
          label: "Identity",
          left: "31%",
          top: "20%",
          delay: 0.4,
        },
        {
          icon: GitBranch,
          label: "Developer",
          left: "57%",
          top: "50%",
          delay: 0.8,
        },
        {
          icon: Network,
          label: "Cloud",
          left: "82%",
          top: "25%",
          delay: 1.2,
        },
      ].map((node) => {
        const Icon = node.icon;

        return (
          <motion.div
            key={node.label}
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -5, 0],
            }}
            transition={{
              opacity: {
                delay: node.delay,
              },
              scale: {
                delay: node.delay,
              },
              y: {
                delay: node.delay,
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            style={{
              left: node.left,
              top: node.top,
            }}
            className="absolute"
          >
            <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[21px] border border-white/[.1] bg-[#171827]/75 shadow-[0_20px_50px_rgba(0,0,0,.35)] backdrop-blur-2xl">
              <Icon
                size={21}
                strokeWidth={1.5}
                className="text-violet-100/70"
              />

              <motion.span
                animate={{
                  opacity: [
                    0.3,
                    1,
                    0.3,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: node.delay,
                }}
                className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_15px_rgba(103,232,249,.8)]"
              />
            </div>

            <div className="mt-2 text-center text-[8px] font-bold uppercase tracking-[.14em] text-white/20">
              {node.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function getErrorMessage(
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
      detail.length > 0
    ) {
      return (
        detail[0]?.msg ??
        "Please check your details."
      );
    }

    if (!error.response) {
      return "Unable to reach the LifeGraph API.";
    }
  }

  return "Something went wrong. Please try again.";
}

export default function AuthScreen() {
  const {
    login,
    register,
  } = useAuth();

  const [mode, setMode] =
    useState<Mode>("login");

  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        await login({
          email,
          password,
        });
      } else {
        await register({
          email,
          password,
          display_name:
            displayName,
        });
      }
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(
    nextMode: Mode,
  ) {
    setMode(nextMode);
    setError(null);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060710] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[12%] -top-[20%] h-[600px] w-[600px] rounded-full bg-violet-600/[.13] blur-[130px]" />

        <div className="absolute -bottom-[25%] right-[-10%] h-[650px] w-[650px] rounded-full bg-cyan-500/[.08] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[.12]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.22) 0.7px, transparent 0.7px)",
            backgroundSize:
              "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="hidden min-h-screen flex-col justify-between border-r border-white/[.06] px-[7vw] py-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-violet-300/[.15] bg-violet-300/[.08]">
              <Network
                size={19}
                className="text-violet-100/75"
              />
            </div>

            <div>
              <div className="font-[Manrope] text-[15px] font-extrabold tracking-[-.03em] text-white/90">
                LifeGraph
              </div>

              <div className="mt-0.5 text-[8px] font-bold uppercase tracking-[.23em] text-white/25">
                Recovery Intelligence
              </div>
            </div>
          </div>

          <div className="max-w-[620px]">
            <motion.div
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="inline-flex items-center gap-2 rounded-full border border-violet-300/[.12] bg-violet-300/[.05] px-3 py-2"
            >
              <Sparkles
                size={11}
                className="text-violet-200/65"
              />

              <span className="text-[8px] font-extrabold uppercase tracking-[.18em] text-violet-100/45">
                Digital resilience,
                visualized
              </span>
            </motion.div>

            <motion.h1
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.08,
              }}
              className="mt-7 max-w-[600px] font-[Manrope] text-[clamp(42px,4vw,68px)] font-semibold leading-[.98] tracking-[-.065em] text-white/90"
            >
              Know what breaks
              <br />
              <span className="bg-gradient-to-r from-violet-200 via-white to-cyan-100 bg-clip-text text-transparent">
                before you lose it.
              </span>
            </motion.h1>

            <p className="mt-6 max-w-[500px] text-[13px] leading-6 text-white/30">
              Map identities, devices,
              cloud services and recovery
              paths into one intelligent
              dependency graph.
            </p>

            <DependencyVisual />

            <div className="mt-6 grid max-w-[520px] grid-cols-3 gap-3">
              {[
                [
                  ShieldCheck,
                  "Private",
                  "No secrets stored",
                ],
                [
                  Network,
                  "Mapped",
                  "Dependency aware",
                ],
                [
                  Fingerprint,
                  "Secure",
                  "JWT protected",
                ],
              ].map(
                ([
                  Icon,
                  title,
                  subtitle,
                ]) => (
                  <div
                    key={String(title)}
                    className="rounded-[18px] border border-white/[.06] bg-white/[.025] p-3 backdrop-blur-xl"
                  >
                    <Icon
                      size={14}
                      className="text-violet-200/50"
                    />

                    <div className="mt-3 text-[9px] font-bold text-white/55">
                      {String(title)}
                    </div>

                    <div className="mt-1 text-[8px] text-white/20">
                      {String(
                        subtitle,
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="text-[9px] text-white/15">
            AI-Powered Digital Life
            Recovery & Dependency
            Management Platform
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
          <motion.div
            initial={{
              opacity: 0,
              x: 25,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.55,
            }}
            className="w-full max-w-[450px]"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-violet-300/[.14] bg-violet-300/[.08]">
                <Network
                  size={17}
                  className="text-violet-100/70"
                />
              </div>

              <span className="font-[Manrope] text-[15px] font-bold">
                LifeGraph
              </span>
            </div>

            <div className="rounded-[30px] border border-white/[.09] bg-[#11121d]/75 p-6 shadow-[0_35px_100px_rgba(0,0,0,.38)] backdrop-blur-3xl sm:p-8">
              <div className="flex rounded-[15px] border border-white/[.06] bg-black/15 p-1">
                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      "login",
                    )
                  }
                  className={`flex-1 rounded-[11px] px-4 py-2.5 text-[10px] font-bold transition ${
                    mode === "login"
                      ? "bg-white/[.08] text-white/80 shadow-sm"
                      : "text-white/25 hover:text-white/50"
                  }`}
                >
                  Sign in
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      "register",
                    )
                  }
                  className={`flex-1 rounded-[11px] px-4 py-2.5 text-[10px] font-bold transition ${
                    mode ===
                    "register"
                      ? "bg-white/[.08] text-white/80 shadow-sm"
                      : "text-white/25 hover:text-white/50"
                  }`}
                >
                  Create account
                </button>
              </div>

              <AnimatePresence
                mode="wait"
              >
                <motion.div
                  key={mode}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                >
                  <div className="mt-8">
                    <div className="text-[9px] font-extrabold uppercase tracking-[.18em] text-violet-200/40">
                      Secure workspace
                    </div>

                    <h2 className="mt-3 font-[Manrope] text-[30px] font-semibold tracking-[-.05em] text-white/90">
                      {mode ===
                      "login"
                        ? "Welcome back."
                        : "Build your safety net."}
                    </h2>

                    <p className="mt-2 text-[11px] leading-5 text-white/25">
                      {mode ===
                      "login"
                        ? "Sign in to your digital resilience command center."
                        : "Create your private recovery intelligence workspace."}
                    </p>
                  </div>

                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="mt-7 space-y-4"
                  >
                    {mode ===
                      "register" && (
                      <label className="block">
                        <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
                          Display name
                        </span>

                        <div className="flex h-[52px] items-center gap-3 rounded-[16px] border border-white/[.075] bg-white/[.025] px-4 transition focus-within:border-violet-300/25 focus-within:bg-violet-300/[.035]">
                          <Fingerprint
                            size={15}
                            className="text-white/25"
                          />

                          <input
                            value={
                              displayName
                            }
                            onChange={(
                              event,
                            ) =>
                              setDisplayName(
                                event
                                  .target
                                  .value,
                              )
                            }
                            minLength={2}
                            maxLength={100}
                            required
                            autoComplete="name"
                            placeholder="Your name"
                            className="w-full bg-transparent text-[12px] text-white/75 outline-none placeholder:text-white/15"
                          />
                        </div>
                      </label>
                    )}

                    <label className="block">
                      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
                        Email
                      </span>

                      <div className="flex h-[52px] items-center gap-3 rounded-[16px] border border-white/[.075] bg-white/[.025] px-4 transition focus-within:border-violet-300/25 focus-within:bg-violet-300/[.035]">
                        <Mail
                          size={15}
                          className="text-white/25"
                        />

                        <input
                          type="email"
                          value={email}
                          onChange={(
                            event,
                          ) =>
                            setEmail(
                              event
                                .target
                                .value,
                            )
                          }
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          className="w-full bg-transparent text-[12px] text-white/75 outline-none placeholder:text-white/15"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[.13em] text-white/25">
                        Password
                      </span>

                      <div className="flex h-[52px] items-center gap-3 rounded-[16px] border border-white/[.075] bg-white/[.025] px-4 transition focus-within:border-violet-300/25 focus-within:bg-violet-300/[.035]">
                        <LockKeyhole
                          size={15}
                          className="text-white/25"
                        />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            password
                          }
                          onChange={(
                            event,
                          ) =>
                            setPassword(
                              event
                                .target
                                .value,
                            )
                          }
                          minLength={
                            mode ===
                            "register"
                              ? 10
                              : 1
                          }
                          maxLength={128}
                          required
                          autoComplete={
                            mode ===
                            "login"
                              ? "current-password"
                              : "new-password"
                          }
                          placeholder={
                            mode ===
                            "register"
                              ? "Minimum 10 characters"
                              : "Enter your password"
                          }
                          className="w-full bg-transparent text-[12px] text-white/75 outline-none placeholder:text-white/15"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) =>
                                !value,
                            )
                          }
                          className="text-white/20 transition hover:text-white/55"
                        >
                          {showPassword ? (
                            <EyeOff
                              size={
                                15
                              }
                            />
                          ) : (
                            <Eye
                              size={
                                15
                              }
                            />
                          )}
                        </button>
                      </div>
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
                          className="rounded-[15px] border border-rose-300/[.12] bg-rose-300/[.055] px-4 py-3 text-[10px] leading-4 text-rose-100/65"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={
                        submitting
                      }
                      className="
                        group flex h-[52px]
                        w-full items-center
                        justify-center gap-2
                        rounded-[16px]
                        bg-gradient-to-r
                        from-violet-200
                        via-white
                        to-cyan-100
                        text-[11px]
                        font-extrabold
                        text-[#11121a]
                        shadow-[0_15px_40px_rgba(139,92,246,.12)]
                        transition
                        hover:-translate-y-0.5
                        disabled:cursor-wait
                        disabled:opacity-60
                      "
                    >
                      {submitting ? (
                        <>
                          <motion.span
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              repeat:
                                Infinity,
                              duration:
                                0.8,
                              ease: "linear",
                            }}
                            className="h-3.5 w-3.5 rounded-full border-2 border-[#11121a]/20 border-t-[#11121a]"
                          />

                          Securing
                          workspace...
                        </>
                      ) : (
                        <>
                          {mode ===
                          "login"
                            ? "Enter command center"
                            : "Create secure workspace"}

                          <ArrowRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 flex items-center justify-center gap-2 text-[9px] text-white/18">
                    <KeyRound
                      size={11}
                    />
                    Passwords are
                    Argon2 protected
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[9px] text-white/15">
              <Check size={11} />
              Recovery metadata only —
              never passwords, recovery
              codes or private keys.
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
