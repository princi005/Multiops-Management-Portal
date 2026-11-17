import { useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Trash2, UserRound } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useDirectory } from "../../hooks/useDirectory";
import { useMyProfile } from "../../hooks/useMe";
import { useDeletedProjects, useProjects } from "../../hooks/useProjects";
import ProjectDetailPanel from "./ProjectDetailPanel";
import ProjectBinPanel from "./ProjectBinPanel";
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectStatusBadge from "./ProjectStatusBadge";

export default function ManagerPortalPage() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const projects = useProjects();
  const directory = useDirectory();
  const deletedProjects = useDeletedProjects();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showBin, setShowBin] = useState(false);

  const list = projects.data ?? [];
  const active = list.find((project) => project.id === selectedId) ?? list[0] ?? null;
  const isOwner = Boolean(active && profile && active.manager_id === profile.employee_id);
  const binCount = deletedProjects.data?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        title="Manager Portal"
        subtitle="Projects & Tickets"
        email={user?.email}
        accent="violet"
      />

      <main className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {showBin ? "Deleted projects" : "Your projects"}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/my-profile"
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-white"
            >
              <UserRound className="h-4 w-4" />
              My profile
            </Link>

            <button
              type="button"
              onClick={() => setShowBin((current) => !current)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm ${
                showBin
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-300 text-slate-700 hover:bg-white"
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {showBin ? "Back to projects" : `Bin (${binCount})`}
            </button>

            {!showBin && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                New project
              </button>
            )}
          </div>
        </div>

        {showBin ? (
          <ProjectBinPanel />
        ) : projects.isLoading ? (
          <LoadingState label="Loading projects..." />
        ) : projects.isError ? (
          <ErrorState
            message="Could not load your projects."
            onRetry={() => projects.refetch()}
          />
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project, then add team members and tickets."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[18rem_1fr]">
            <aside className="space-y-2">
              {list.map((project) => {
                const selected = active?.id === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedId(project.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <ProjectStatusBadge status={project.status} />
                      <span className="text-xs text-slate-400">
                        {project.members.length} member
                        {project.members.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </aside>

            <section>
              {active && (
                <ProjectDetailPanel
                  key={active.id}
                  project={active}
                  isOwner={isOwner}
                  directory={directory.data ?? []}
                  onDeleted={() => {
                    setSelectedId(null);
                    setShowBin(true);
                  }}
                />
              )}
            </section>
          </div>
        )}
      </main>

      {creating && (
        <ProjectFormDialog
          onClose={() => setCreating(false)}
          onSaved={(project) => setSelectedId(project.id)}
        />
      )}
    </div>
  );
}
