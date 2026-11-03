import { Search } from "lucide-react";
import type { RequestStatus } from "../types/employeeRequest";

const STATUS_OPTIONS: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function RequestFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  accent = "violet",
}: {
  search: string;
  onSearchChange: (v: string) => void;
  status: RequestStatus | "all";
  onStatusChange: (v: RequestStatus | "all") => void;
  accent?: "violet" | "teal";
}) {
  const ring = accent === "teal" ? "focus:ring-teal-500" : "focus:ring-violet-500";
  const activePill = accent === "teal" ? "bg-teal-600 text-white" : "bg-violet-600 text-white";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, code..."
          className={`w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`}
        />
      </div>
      <div className="flex gap-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={`px-3 py-2 rounded-lg text-xs font-medium ${
              status === opt.value ? activePill : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}