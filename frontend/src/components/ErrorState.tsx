import { AlertTriangle } from "lucide-react";

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="max-w-md text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg px-3 py-2 text-sm font-bold text-violet-700 underline-offset-4 hover:bg-violet-50 hover:underline dark:text-violet-300 dark:hover:bg-white/5"
        >
          Try again
        </button>
      )}
    </div>
  );
}
