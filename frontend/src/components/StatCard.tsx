import type { LucideIcon } from "lucide-react";

const COLOR_MAP = {
  indigo: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200",
} as const;

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "indigo",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: keyof typeof COLOR_MAP;
}) {
  return (
    <section
      className="mo-card flex items-center gap-4 rounded-2xl p-5"
      style={{
        backgroundColor: "var(--mo-card)",
        borderColor: "var(--mo-border-glass)",
        boxShadow: "var(--mo-shadow)",
      }}
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${COLOR_MAP[color]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</p>
      </div>
    </section>
  );
}
