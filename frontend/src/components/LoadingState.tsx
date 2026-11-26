import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-10 text-sm font-medium text-slate-500 dark:text-slate-400"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-300" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
