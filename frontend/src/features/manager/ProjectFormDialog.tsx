import { useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { useCreateProject, useUpdateProject } from "../../hooks/useProjects";
import { getErrorMessage } from "../../lib/errors";
import { emptyToNull, statusLabel } from "../../lib/projectFormat";
import { PROJECT_STATUSES } from "../../types/project";
import type { Project, ProjectStatus } from "../../types/project";

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500";

export default function ProjectFormDialog({
  project,
  onClose,
  onSaved,
}: {
  project?: Project;
  onClose: () => void;
  onSaved?: (project: Project) => void;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [version, setVersion] = useState(project?.version ?? "");
  const [technology, setTechnology] = useState(project?.technology ?? "");
  const [requirements, setRequirements] = useState(project?.requirements_text ?? "");
  const [startDate, setStartDate] = useState(project?.start_date ?? "");
  const [endDate, setEndDate] = useState(project?.end_date ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");

  const create = useCreateProject();
  const update = useUpdateProject();
  const saving = create.isPending || update.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      toast.error("End date cannot be before the start date.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: emptyToNull(description),
      version: emptyToNull(version),
      technology: emptyToNull(technology),
      requirements_text: emptyToNull(requirements),
      start_date: startDate || null,
      end_date: endDate || null,
    };

    try {
      const saved = project
        ? await update.mutateAsync({ id: project.id, payload: { ...payload, status } })
        : await create.mutateAsync(payload);
      toast.success(project ? "Project updated." : "Project created.");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save the project."));
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {project ? "Edit project" : "New project"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
              Name *
            </label>
            <input className={INPUT} value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
              Description
            </label>
            <textarea
              className={INPUT}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                Version
              </label>
              <input
                className={INPUT}
                value={version}
                maxLength={20}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                Technology
              </label>
              <input
                className={INPUT}
                value={technology}
                maxLength={300}
                onChange={(e) => setTechnology(e.target.value)}
                placeholder="e.g. React, FastAPI, Postgres"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                Start date
              </label>
              <input type="date" className={INPUT} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                End date
              </label>
              <input type="date" className={INPUT} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {project && (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                Status
              </label>
              <select
                className={INPUT}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
              Requirements
            </label>
            <textarea
              className={INPUT}
              rows={6}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Paste or write the project requirements here."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : project ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}