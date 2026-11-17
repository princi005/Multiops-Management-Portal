import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, UserRound } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useDirectory } from "../../hooks/useDirectory";
import { useMyProfile } from "../../hooks/useMe";
import { useProjects } from "../../hooks/useProjects";
import ProjectDetailPanel from "./ProjectDetailPanel";
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectStatusBadge from "./ProjectStatusBadge";

export default function ManagerPortalPage() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const projects = useProjects();
  const directory = useDirectory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const list = projects.data ?? [];
  const active = list.find((p) => p.id === selectedId) ?? list[0] ?? null;
  const isOwner = Boolean(active && profile && active.manager_id === profile.employee_id);

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader title="Manager Portal" subtitle="Projects & Tickets" email={user?.email} accent="violet" />

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Your projects</h2>
          <div className="flex items-center gap-3">
            <Link
              to="/my-profile"
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-white"
            >
              <UserRound className="w-4 h-4" />
              My profile
            </Link>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              New project
            </button>
          </div>
        </div>

        {projects.isLoading ? (
          <LoadingState label="Loading projects..." />
        ) : projects.isError ? (
          <ErrorState message="Could not load your projects." onRetry={() => projects.refetch()} />
        ) : list.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project, then add team members and tickets."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6 items-start">
            <aside className="space-y-2">
              {list.map((p) => {
                const selected = active?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      selected
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <ProjectStatusBadge status={p.status} />
                      <span className="text-xs text-slate-400">
                        {p.members.length} member{p.members.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </aside>

            <section>
              {active && <ProjectDetailPanel key={active.id} project={active} isOwner={isOwner} directory={directory.data ?? []} />}
            </section>
          </div>
        )}
      </main>

      {creating && (
        <ProjectFormDialog onClose={() => setCreating(false)} onSaved={(p) => setSelectedId(p.id)} />
      )}
    </div>
  );
}