import { RotateCcw, Trash2 } from "lucide-react";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import { useDeletedProjects, useRestoreProject } from "../../hooks/useProjects";
import type { Project } from "../../types/project";

function getDaysRemaining(deletedAt: string): number {
  const deletedTime = new Date(deletedAt).getTime();
  const elapsedDays = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, 30 - elapsedDays);
}

function DeletedProjectRow({ project }: { project: Project }) {
  const restore = useRestoreProject();
  const daysRemaining = project.deleted_at ? getDaysRemaining(project.deleted_at) : 30;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-semibold text-slate-900">{project.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {project.members.length} member{project.members.length === 1 ? "" : "s"}
          {" · "}
          {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left to restore
        </p>
        {project.deleted_at && (
          <p className="mt-1 text-xs text-slate-400">
            Moved to bin {new Date(project.deleted_at).toLocaleString()}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => restore.mutate(project.id)}
        disabled={restore.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        {restore.isPending ? "Restoring..." : "Restore"}
      </button>

      {restore.isError && (
        <p className="text-sm text-red-600">
          Could not restore this project. Its recovery period may have expired.
        </p>
      )}
    </article>
  );
}

export default function ProjectBinPanel() {
  const projects = useDeletedProjects();

  if (projects.isLoading) {
    return <LoadingState label="Loading deleted projects..." />;
  }

  if (projects.isError) {
    return (
      <ErrorState
        message="Could not load the project bin."
        onRetry={() => projects.refetch()}
      />
    );
  }

  const deletedProjects = projects.data ?? [];

  const recycleBinNotice = (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      Projects can be restored during the recovery period. Permanent deletion is not available in this UI preview.
    </p>
  );

  if (deletedProjects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
        <Trash2 className="mx-auto h-8 w-8 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900">The project bin is empty</h3>
        <p className="mt-1 text-sm text-slate-500">
          Projects you delete will stay here for 30 days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">`n      {recycleBinNotice}
      {deletedProjects.map((project) => (
        <DeletedProjectRow key={project.id} project={project} />
      ))}
    </div>
  );
}
