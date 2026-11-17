import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, ChevronDown, LogOut, UserRound } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../hooks/useNotifications";

const ACCENT_MAP = {
  indigo: { dot: "bg-indigo-600", label: "text-indigo-600", badge: "bg-indigo-600" },
  teal: { dot: "bg-teal-600", label: "text-teal-600", badge: "bg-teal-600" },
  violet: { dot: "bg-violet-600", label: "text-violet-600", badge: "bg-violet-600" },
  sky: { dot: "bg-sky-600", label: "text-sky-600", badge: "bg-sky-600" },
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
  const { data: user } = useCurrentUser();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const roles = user?.roles ?? [];
  const unread = (notifications.data ?? []).filter((item) => !item.read_at);
  const isCeo = roles.includes("CEO");
  const isAccounts = roles.includes("Accounts");
  const isHr = roles.includes("HR");
  const isManager = roles.includes("Manager");
  const showMyProjects = !isCeo && !isHr && (
    isManager || isAccounts || roles.includes("Employee")
  );

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sm:px-8">
      <div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${colors.label}`}>
            {subtitle}
          </span>
        </div>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {email && <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>}

        <div className="relative">
          <button
            type="button"
            aria-label={`Notifications, ${unread.length} unread`}
            aria-expanded={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            className={`relative rounded-lg p-2 hover:bg-slate-50 ${colors.label}`}
          >
            <Bell className="h-5 w-5" />
            {unread.length > 0 && (
              <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white ${colors.badge}`}>
                {unread.length > 99 ? "99+" : unread.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <button
                type="button"
                aria-label="Close notifications"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setNotificationsOpen(false)}
              />
              <section className="absolute right-0 z-20 mt-2 w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                    <p className="text-xs text-slate-500">{unread.length} unread</p>
                  </div>
                  {unread.length > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead.mutate()}
                      disabled={markAllRead.isPending}
                      className={`flex items-center gap-1 text-xs font-medium ${colors.label} disabled:opacity-50`}
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[65vh] overflow-y-auto">
                  {notifications.isLoading ? (
                    <p className="p-4 text-sm text-slate-500">Loading notifications...</p>
                  ) : notifications.isError ? (
                    <button
                      type="button"
                      onClick={() => notifications.refetch()}
                      className="p-4 text-left text-sm text-red-600"
                    >
                      Could not load notifications. Retry
                    </button>
                  ) : (notifications.data ?? []).length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">You have no notifications.</p>
                  ) : (
                    notifications.data!.slice(0, 30).map((item) => (
                      <article
                        key={item.id}
                        className={`border-b border-slate-100 px-4 py-3 last:border-0 ${
                          item.read_at ? "" : "bg-sky-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                            <p className="mt-1.5 text-xs text-slate-400">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!item.read_at && (
                            <button
                              type="button"
                              aria-label="Mark notification as read"
                              onClick={() => markRead.mutate(item.id)}
                              disabled={markRead.isPending}
                              className={`shrink-0 text-xs font-medium ${colors.label} disabled:opacity-50`}
                            >
                              Read
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-1 rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
          >
            <UserRound className="h-5 w-5" />
            <ChevronDown className="h-4 w-4" />
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setProfileOpen(false)}
              />
              <nav className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                <Link
                  to="/my-profile"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  My Profile
                </Link>

                {showMyProjects && (
                  <Link
                    to="/my-projects"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Projects
                  </Link>
                )}

                {isManager && (
                  <Link
                    to="/workspace/manager"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Manager Workspace
                  </Link>
                )}

                {isHr && (
                  <Link
                    to="/workspace/hr"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    HR Workspace
                  </Link>
                )}

                {isCeo && (
                  <Link
                    to="/workspace/ceo"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    CEO Workspace
                  </Link>
                )}

                {isAccounts && (
                  <Link
                    to="/workspace"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Workspace
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => supabase.auth.signOut()}
                  className="mt-2 flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </nav>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
