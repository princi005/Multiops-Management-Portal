import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, ChevronDown, LogOut, UserRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ThemeControl from "./ThemeControl";
import { clearActiveOrganizationId } from "../lib/activeOrganization";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";

const ACCENT_MAP = {
  indigo: { dot: "bg-indigo-600", label: "text-indigo-700 dark:text-indigo-300", badge: "bg-indigo-600" },
  teal: { dot: "bg-teal-600", label: "text-teal-700 dark:text-teal-300", badge: "bg-teal-600" },
  violet: { dot: "bg-violet-600", label: "text-violet-700 dark:text-violet-300", badge: "bg-violet-600" },
  sky: { dot: "bg-sky-600", label: "text-sky-700 dark:text-sky-300", badge: "bg-sky-600" },
} as const;

export default function PortalHeader({
  title,
  subtitle,
  accent = "indigo",
}: {
  title: string;
  subtitle: string;
  email?: string;
  accent?: keyof typeof ACCENT_MAP;
  showProfile?: boolean;
}) {
  const colors = ACCENT_MAP[accent];
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unread = (notifications.data ?? []).filter((item) => !item.read_at);

  return (
    <header className="portal-header flex items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-9">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
          <span className={`text-[11px] font-extrabold uppercase tracking-[0.16em] ${colors.label}`}>
            {subtitle}
          </span>
        </div>
        <h1 className="mt-1 truncate text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications, ${unread.length} unread`}
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className={`relative rounded-xl border p-2.5 transition hover:bg-violet-50 dark:hover:bg-white/5 ${colors.label}`}
            style={{ borderColor: "var(--mo-border)" }}
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unread.length > 0 && (
              <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white ${colors.badge}`}>
                {unread.length > 99 ? "99+" : unread.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section
              aria-label="Notifications"
              className="absolute right-0 z-50 mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border shadow-xl"
              style={{
                borderColor: "var(--mo-border)",
                backgroundColor: "var(--mo-elevated)",
                boxShadow: "var(--mo-shadow-board)",
              }}
            >
              <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--mo-border)" }}>
                <h2 className="font-bold">Notifications</h2>
                {unread.length > 0 && (
                  <button
                    type="button"
                    aria-label="Mark all notifications as read"
                    onClick={() => markAllRead.mutate()}
                    className="rounded-lg p-2 text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-white/5"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.isLoading ? (
                  <p className="p-4 text-sm text-slate-500">Loading notifications…</p>
                ) : (notifications.data ?? []).length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">You’re all caught up.</p>
                ) : (
                  (notifications.data ?? []).slice(0, 30).map((item) => (
                    <article
                      key={item.id}
                      className="border-b p-4 last:border-b-0"
                      style={{ borderColor: "var(--mo-border)" }}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                      {!item.read_at && (
                        <button
                          type="button"
                          className="mt-2 text-sm font-semibold text-violet-700 hover:underline dark:text-violet-300"
                          onClick={() => markRead.mutate(item.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 rounded-xl border p-2 text-slate-700 transition hover:bg-violet-50 dark:text-slate-200 dark:hover:bg-white/5"
            style={{ borderColor: "var(--mo-border)" }}
          >
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>

          {profileOpen && (
            <nav
              aria-label="Account menu"
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border py-2 shadow-xl"
              style={{
                borderColor: "var(--mo-border)",
                backgroundColor: "var(--mo-elevated)",
                boxShadow: "var(--mo-shadow-board)",
              }}
            >
              <Link
                to="/my-profile"
                className="block px-4 py-3 text-sm font-semibold hover:bg-violet-50 dark:hover:bg-white/5"
              >
                My Profile
              </Link>
              <div className="border-y px-4 py-3" style={{ borderColor: "var(--mo-border)" }}>
                <ThemeControl />
              </div>
              <button
                type="button"
                onClick={() => {
                  clearActiveOrganizationId();
                  void supabase.auth.signOut();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
