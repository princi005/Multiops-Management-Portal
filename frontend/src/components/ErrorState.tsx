import { AlertTriangle } from "lucide-react";

export default function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center py-8">
      <AlertTriangle className="w-6 h-6 text-red-500" />
      <p className="text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-indigo-600 font-medium underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}