import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Inbox as InboxIcon } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import AppButton from "../../components/ui/AppButton";
import SurfaceCard from "../../components/ui/SurfaceCard";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import { useActiveOrganization } from "../../hooks/useActiveOrganizationInfo";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import { useOrganizationSettings } from "../../hooks/useOrganizations";
import type { NotificationItem } from "../../types/notification";
import InboxDetailPanel from "./inbox/InboxDetailPanel";
import InboxEmptyState from "./inbox/InboxEmptyState";
import InboxFilterBar from "./inbox/InboxFilterBar";
import InboxNotificationList from "./inbox/InboxNotificationList";
import InboxRetentionNote from "./inbox/InboxRetentionNote";
import InboxSummaryCards from "./inbox/InboxSummaryCards";
import type { InboxFilter } from "./inbox/inboxUtils";
import { categoryForKind } from "./inbox/inboxUtils";

export default function InboxPage() {
  const { data: user } = useCurrentUser();
  const activeOrganization = useActiveOrganization();
  const isOrganizationAdmin = user?.organization_roles.includes("org_admin") ?? false;
  const settings = useOrganizationSettings(
    isOrganizationAdmin ? activeOrganization.data?.organization.id : undefined,
  );
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = useMemo(
    () => [...(notifications.data ?? [])].sort(
      (left, right) => right.created_at.localeCompare(left.created_at),
    ),
    [notifications.data],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const category = categoryForKind(item.kind);
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !item.read_at) ||
        category === filter;
      const matchesSearch =
        !needle ||
        `${item.title} ${item.message} ${item.kind}`.toLocaleLowerCase().includes(needle);
      return matchesFilter && matchesSearch;
    });
  }, [items, filter, query]);

  const selected: NotificationItem | null =
    filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!selectedId && items.length > 0) setSelectedId(items[0].id);
  }, [items, selectedId]);

  const workLink = user?.roles.includes("Manager") ? "/workspace/manager" : "/my-projects";
  const retentionDays = settings.data?.inbox_retention_days ?? 15;

  return (
    <div className="min-h-screen">
      <PortalHeader title="Inbox" subtitle="Notifications" email={user?.email} accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">My workspace</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight">
              <InboxIcon className="h-8 w-8 text-violet-700" />Inbox
            </h1>
            <p className="mt-2 text-sm text-slate-500">Project assignments, ticket updates, requests, comments, and company news.</p>
          </div>
          {(items.some((item) => !item.read_at)) && (
            <AppButton type="button" variant="secondary" disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4" />
              {markAllRead.isPending ? "Marking…" : "Mark all read"}
            </AppButton>
          )}
        </header>

        <InboxSummaryCards items={items} />

        <InboxRetentionNote
          isOrganizationAdmin={isOrganizationAdmin}
          days={retentionDays}
          isLoading={isOrganizationAdmin && settings.isLoading}
        />

        <InboxFilterBar filter={filter} query={query} onFilterChange={setFilter} onQueryChange={setQuery} />

        {notifications.isLoading ? (
          <LoadingState label="Loading your inbox…" />
        ) : notifications.isError ? (
          <ErrorState message="Could not load your notifications." onRetry={() => notifications.refetch()} />
        ) : filtered.length === 0 ? (
          <SurfaceCard><InboxEmptyState filtered={items.length > 0} /></SurfaceCard>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
            <SurfaceCard className="overflow-hidden p-0">
              <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--mo-border)" }}>
                <h2 className="text-sm font-bold">Notifications</h2>
                <span className="text-xs text-slate-500">{filtered.length} shown</span>
              </div>
              <InboxNotificationList
                items={filtered}
                selectedId={selected?.id ?? null}
                onSelect={(item) => setSelectedId(item.id)}
                onMarkRead={(item) => markRead.mutate(item.id)}
              />
            </SurfaceCard>

            <SurfaceCard className="p-0">
              <InboxDetailPanel
                item={selected}
                workLink={workLink}
                onMarkRead={(item) => markRead.mutate(item.id)}
                markReadPending={markRead.isPending}
              />
            </SurfaceCard>
          </section>
        )}

        <p className="text-center text-xs text-slate-500">Inbox items are loaded from the existing notification service. Retention cleanup is not implemented by this screen.</p>
      </main>
    </div>
  );
}
