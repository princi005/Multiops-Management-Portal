import { LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const ACCENT_MAP = {
  indigo: { dot: "bg-indigo-600", label: "text-indigo-600" },
  teal: { dot: "bg-teal-600", label: "text-teal-600" },
  violet: { dot: "bg-violet-600", label: "text-violet-600" },
  sky: { dot: "bg-sky-600", label: "text-sky-600" },
} as const;

export default function PortalHeader({
  title,
  subtitle,
  email,
  accent = "indigo",
}: {
  title: string;
  subtitle: string;
  email?: string;
  accent?: keyof typeof ACCENT_MAP;
}) {
  const colors = ACCENT_MAP[accent];

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className={`text-xs font-semibold tracking-wide uppercase ${colors.label}`}>
            {subtitle}
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-1">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {email && <span className="text-sm text-slate-500">{email}</span>}
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}