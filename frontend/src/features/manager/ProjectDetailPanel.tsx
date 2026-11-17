import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useSoftDeleteProject } from "../../hooks/useProjects";
import { formatDate } from "../../lib/projectFormat";
import type { DirectoryEmployee, Project } from "../../types/project";
import Dropdown, { DropdownItem } from "../../components/Dropdown";
import MembersPanel from "./MembersPanel";
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectStatusBadge from "./ProjectStatusBadge";
import TicketsPanel from "./TicketsPanel";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}

export default function ProjectDetailPanel({
  project,
  isOwner,
  directory,
  onDeleted,
}: {
  project: Project;
  isOwner: boolean;
  directory: DirectoryEmployee[];
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const deleteProject = useSoftDeleteProject();

  function handleDelete() {
    if (!window.confirm(`Move "${project.name}" to the bin? It can be restored for 30 days.`)) return;

    deleteProject.mutate(project.id, {
      onSuccess: onDeleted,
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{project.name}</h2>
              <ProjectStatusBadge status={project.status} />
              {!isOwner && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Member</span>}
            </div>
            {project.description && <p className="mt-1 text-sm text-slate-600">{project.description}</p>}
          </div>

          {isOwner && (
            <Dropdown>
              <DropdownItem onClick={() => setEditing(true)} icon={<Pencil className="h-4 w-4" />}>
                Edit
              </DropdownItem>
              <DropdownItem
                onClick={handleDelete}
                icon={<Trash2 className="h-4 w-4" />}
                danger
                disabled={deleteProject.isPending}
              >
                {deleteProject.isPending ? "Moving to bin..." : "Delete"}
              </DropdownItem>
            </Dropdown>
          )}
        </div>

        {deleteProject.isError && <p className="mt-3 text-sm text-red-600">Could not move the project to the bin.</p>}

        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
          <Field label="Version" value={project.version ?? "-"} />
          <Field label="Technology" value={project.technology ?? "-"} />
          <Field label="Start date" value={formatDate(project.start_date)} />
          <Field label="End date" value={formatDate(project.end_date)} />
        </div>

        {project.requirements_text && (
          <details className="mt-5">
            <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-slate-500">Requirements</summary>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{project.requirements_text}</p>
          </details>
        )}
      </div>

      <MembersPanel project={project} isOwner={isOwner} directory={directory} />
      <TicketsPanel project={project} isOwner={isOwner} directory={directory} />

      {editing && <ProjectFormDialog project={project} onClose={() => setEditing(false)} />}
    </div>
  );
}
