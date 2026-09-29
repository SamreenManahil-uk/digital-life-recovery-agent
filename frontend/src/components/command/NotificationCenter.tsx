import {
  Activity,
  Bell,
  Check,
  GitBranch,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  useMemo,
  useState,
} from "react";

type Notification = {
  id: number;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
  type: "security" | "dependency" | "incident";
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Recovery method verified",
    detail:
      "Gmail now has a verified recovery method.",
    time: "12 min",
    unread: true,
    type: "security",
  },
  {
    id: 2,
    title: "Dependency changed",
    detail:
      "GitHub → Vercel dependency was updated.",
    time: "1 hr",
    unread: true,
    type: "dependency",
  },
  {
    id: 3,
    title: "Risk analysis completed",
    detail:
      "5 services were included in cascade analysis.",
    time: "Today",
    unread: false,
    type: "security",
  },
  {
    id: 4,
    title: "Single point of failure",
    detail:
      "A recovery weakness needs attention.",
    time: "Yesterday",
    unread: false,
    type: "incident",
  },
];

const icons = {
  security: ShieldCheck,
  dependency: GitBranch,
  incident: TriangleAlert,
};

export default function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.unread,
      ).length,
    [notifications],
  );

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  };

  const markRead = (id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification,
      ),
    );
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              aria-label="Close notifications"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[80] bg-[#05050c]/30 backdrop-blur-[2px]"
            />

            <motion.aside
              initial={{
                opacity: 0,
                x: 80,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: 80,
                scale: 0.98,
              }}
              transition={{
                duration: 0.28,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="
                fixed bottom-5 right-5 top-5
                z-[90] w-[390px]
                overflow-hidden rounded-[28px]
                border border-white/[.1]
                bg-[#11111d]/95
                shadow-[0_35px_110px_rgba(0,0,0,.55)]
                backdrop-blur-3xl
              "
            >
              <div className="absolute -right-24 -top-20 h-[250px] w-[250px] rounded-full bg-violet-400/[.09] blur-[80px]" />

              <div className="relative flex h-full flex-col">
                <div className="border-b border-white/[.07] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Bell
                          size={15}
                          className="text-violet-200/60"
                        />

                        <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/25">
                          Intelligence feed
                        </span>
                      </div>

                      <h2 className="mt-3 font-[Manrope] text-[22px] font-semibold tracking-[-.04em] text-white/85">
                        Notifications
                      </h2>

                      <p className="mt-1 text-[10px] text-white/25">
                        {unreadCount > 0
                          ? `${unreadCount} unread updates`
                          : "You're all caught up"}
                      </p>
                    </div>

                    <button
                      onClick={onClose}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.035] text-white/35 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="mt-4 flex items-center gap-2 text-[9px] font-bold text-violet-200/55 transition hover:text-violet-100"
                    >
                      <Check size={12} />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {notifications.map(
                    (notification) => {
                      const Icon =
                        icons[
                          notification.type
                        ];

                      return (
                        <motion.button
                          layout
                          key={notification.id}
                          onClick={() =>
                            markRead(
                              notification.id,
                            )
                          }
                          className={`
                            relative mb-2 flex w-full
                            gap-3 rounded-[20px]
                            border p-4 text-left
                            transition
                            ${
                              notification.unread
                                ? "border-violet-300/[.1] bg-violet-300/[.045]"
                                : "border-white/[.05] bg-white/[.018]"
                            }
                            hover:bg-white/[.05]
                          `}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[.07] bg-white/[.035]">
                            <Icon
                              size={16}
                              className={
                                notification.type ===
                                "incident"
                                  ? "text-rose-200/65"
                                  : "text-violet-200/60"
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <span className="flex-1 text-[11px] font-bold text-white/65">
                                {
                                  notification.title
                                }
                              </span>

                              {notification.unread && (
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300 shadow-[0_0_9px_rgba(196,181,253,.7)]" />
                              )}
                            </div>

                            <p className="mt-1.5 text-[10px] leading-4 text-white/28">
                              {
                                notification.detail
                              }
                            </p>

                            <span className="mt-2 block text-[8px] font-semibold uppercase tracking-[.12em] text-white/17">
                              {notification.time}
                            </span>
                          </div>
                        </motion.button>
                      );
                    },
                  )}
                </div>

                <div className="border-t border-white/[.06] p-4">
                  <div className="flex items-center justify-center gap-2 text-[9px] text-white/20">
                    <Activity size={11} />
                    Security activity is monitored
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
