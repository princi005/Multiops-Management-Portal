import { useState } from "react";
import { Pencil } from "lucide-react";
import { formatDate } from "../../lib/projectFormat";
import type { DirectoryEmployee, Project } from "../../types/project";
import MembersPanel from "./MembersPanel";
import ProjectFormDialog from "./ProjectFormDialog";
import ProjectStatusBadge from "./ProjectStatusBadge";
import TicketsPanel from "./TicketsPanel";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value}</p>
    </div>
  );
}

export default function ProjectDetailPanel({
  project,
  isOwner,
  directory,
}: {
  project: Project;
  isOwner: boolean;
  directory: DirectoryEmployee[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{project.name}</h2>
              <ProjectStatusBadge status={project.status} />
              {!isOwner && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Member</span>
              )}
            </div>
            {project.description && <p className="mt-1 text-sm text-slate-600">{project.description}</p>}
          </div>
          {isOwner && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
          <Field label="Version" value={project.version ?? "-"} />
          <Field label="Technology" value={project.technology ?? "-"} />
          <Field label="Start date" value={formatDate(project.start_date)} />
          <Field label="End date" value={formatDate(project.end_date)} />
        </div>

        {project.requirements_text && (
          <details className="mt-5">
            <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-500 font-medium">
              Requirements
            </summary>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{project.requirements_text}</p>
          </details>
        )}
      </div>

      <MembersPanel project={project} isOwner={isOwner} directory={directory} />
      <TicketsPanel project={project} isOwner={isOwner} directory={directory} />

      {editing && <ProjectFormDialog project={project} onClose={() => setEditing(false)} />}
    </div>
  );
}