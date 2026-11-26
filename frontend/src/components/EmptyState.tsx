import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="max-w-md">
        <p className="font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
