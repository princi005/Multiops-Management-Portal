import type { LucideIcon } from "lucide-react";

const COLOR_MAP = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${COLOR_MAP[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}