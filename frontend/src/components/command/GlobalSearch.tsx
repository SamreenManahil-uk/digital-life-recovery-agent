import {
  Activity,
  Boxes,
  GitBranch,
  Globe2,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Network,
  Search,
  Smartphone,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  keywords: string[];
  icon: typeof Search;
};

const searchItems: SearchItem[] = [
  {
    id: "command-center",
    title: "Command Center",
    subtitle: "Digital resilience overview",
    category: "Page",
    keywords: ["dashboard", "home", "resilience"],
    icon: LayoutDashboard,
  },
  {
    id: "digital-assets",
    title: "Digital Assets",
    subtitle: "Manage connected services",
    category: "Page",
    keywords: ["services", "accounts", "assets"],
    icon: Boxes,
  },
  {
    id: "dependency-universe",
    title: "Dependency Universe",
    subtitle: "Explore your dependency graph",
    category: "Page",
    keywords: ["graph", "network", "dependencies"],
    icon: Network,
  },
  {
    id: "incidents",
    title: "Incidents",
    subtitle: "Review access-loss incidents",
    category: "Page",
    keywords: ["failure", "risk", "incident"],
    icon: TriangleAlert,
  },
  {
    id: "recovery",
    title: "Recovery",
    subtitle: "Recovery plans and actions",
    category: "Page",
    keywords: ["plan", "restore", "actions"],
    icon: LifeBuoy,
  },
  {
    id: "recovery-methods",
    title: "Recovery Methods",
    subtitle: "Manage recovery readiness",
    category: "Page",
    keywords: ["2fa", "backup", "security"],
    icon: KeyRound,
  },
  {
    id: "activity",
    title: "Activity",
    subtitle: "Security and recovery events",
    category: "Page",
    keywords: ["audit", "history", "events"],
    icon: Activity,
  },
  {
    id: "phone",
    title: "Primary iPhone",
    subtitle: "Trusted device · Risk 100",
    category: "Digital asset",
    keywords: ["phone", "iphone", "device", "trusted"],
    icon: Smartphone,
  },
  {
    id: "gmail",
    title: "Gmail",
    subtitle: "Primary identity · Risk 90",
    category: "Digital asset",
    keywords: ["email", "google", "identity"],
    icon: Mail,
  },
  {
    id: "github",
    title: "GitHub",
    subtitle: "Developer identity · Risk 60",
    category: "Digital asset",
    keywords: ["developer", "code", "repository"],
    icon: GitBranch,
  },
  {
    id: "vercel",
    title: "Vercel",
    subtitle: "Cloud deployment · Risk 48",
    category: "Digital asset",
    keywords: ["cloud", "deployment", "hosting"],
    icon: Globe2,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    subtitle: "Public service · Risk 27",
    category: "Digital asset",
    keywords: ["website", "web", "portfolio"],
    icon: Globe2,
  },
];

export default function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handler);

    return () =>
      window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo(() => {
    const normalized = query
      .trim()
      .toLowerCase();

    if (!normalized) {
      return searchItems.slice(0, 7);
    }

    return searchItems.filter((item) => {
      const haystack = [
        item.title,
        item.subtitle,
        item.category,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          className="
            fixed inset-0 z-[100]
            flex justify-center
            bg-[#05050c]/65 px-4 pt-[12vh]
            backdrop-blur-md
          "
        >
          <motion.div
            initial={{
              opacity: 0,
              y: -18,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -12,
              scale: 0.98,
            }}
            transition={{
              duration: 0.22,
            }}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            className="
              h-fit max-h-[620px] w-full max-w-[660px]
              overflow-hidden rounded-[28px]
              border border-white/[.11]
              bg-[#11111d]/95
              shadow-[0_40px_120px_rgba(0,0,0,.6)]
              backdrop-blur-3xl
            "
          >
            <div className="flex items-center gap-3 border-b border-white/[.07] px-5">
              <Search
                size={18}
                className="shrink-0 text-violet-200/60"
              />

              <input
                ref={inputRef}
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search services, pages, recovery..."
                className="
                  h-[68px] flex-1 bg-transparent
                  text-[14px] text-white/80
                  outline-none
                  placeholder:text-white/20
                "
              />

              <button
                onClick={onClose}
                className="
                  flex h-8 w-8 items-center
                  justify-center rounded-xl
                  border border-white/[.07]
                  bg-white/[.035]
                  text-white/35
                  transition hover:text-white
                "
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-[470px] overflow-y-auto p-3">
              <div className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[.18em] text-white/20">
                {query
                  ? `${results.length} results`
                  : "Quick access"}
              </div>

              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={onClose}
                        className="
                          group flex w-full items-center
                          gap-3 rounded-[18px] px-3
                          py-3 text-left transition
                          hover:bg-white/[.055]
                        "
                      >
                        <div
                          className="
                            flex h-10 w-10 shrink-0
                            items-center justify-center
                            rounded-[14px]
                            border border-white/[.07]
                            bg-white/[.035]
                            transition
                            group-hover:border-violet-300/[.15]
                            group-hover:bg-violet-300/[.07]
                          "
                        >
                          <Icon
                            size={16}
                            className="text-white/45"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-bold text-white/70">
                            {item.title}
                          </div>

                          <div className="mt-1 text-[10px] text-white/25">
                            {item.subtitle}
                          </div>
                        </div>

                        <span className="rounded-full border border-white/[.06] px-2 py-1 text-[8px] font-bold uppercase tracking-[.1em] text-white/20">
                          {item.category}
                        </span>

                        <span className="text-white/15 transition group-hover:translate-x-1 group-hover:text-violet-200/50">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/[.06] bg-white/[.025]">
                    <Search
                      size={18}
                      className="text-white/20"
                    />
                  </div>

                  <div className="mt-4 text-[12px] font-bold text-white/45">
                    Nothing found
                  </div>

                  <div className="mt-1 text-[10px] text-white/20">
                    Try another service or feature.
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[.06] px-5 py-3">
              <span className="text-[9px] text-white/18">
                Search across your digital life
              </span>

              <div className="flex items-center gap-3 text-[9px] text-white/18">
                <span>ESC close</span>
                <span>⌘K open</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
