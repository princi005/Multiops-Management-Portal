import { Bell, CheckCheck } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";

export default function EmployeeNotificationsSection() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        {(notifications.data ?? []).some((item) => !item.read_at) && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:text-sky-800 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Loading notifications...
        </div>
      ) : notifications.isError ? (
        <div className="rounded-xl border border-red-200 bg-white p-5 text-sm text-red-700">
          Could not load notifications.
          <button
            type="button"
            onClick={() => notifications.refetch()}
            className="ml-2 font-medium underline"
          >
            Retry
          </button>
        </div>
      ) : (notifications.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          You have no notifications yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.data!.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border bg-white p-4 ${
                item.read_at ? "border-slate-200" : "border-sky-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                {!item.read_at && (
                  <button
                    type="button"
                    onClick={() => markRead.mutate(item.id)}
                    disabled={markRead.isPending}
                    className="shrink-0 text-xs font-medium text-sky-700 hover:underline disabled:opacity-50"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
