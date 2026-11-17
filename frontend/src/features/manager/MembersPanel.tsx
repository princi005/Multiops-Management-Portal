import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2, UserPlus } from "lucide-react";
import { useAddProjectMember, useRemoveProjectMember } from "../../hooks/useProjects";
import { getErrorMessage } from "../../lib/errors";
import { employeeLabel } from "../../lib/projectFormat";
import type { DirectoryEmployee, Project } from "../../types/project";

export default function MembersPanel({
  project,
  isOwner,
  directory,
}: {
  project: Project;
  isOwner: boolean;
  directory: DirectoryEmployee[];
}) {
  const [selected, setSelected] = useState("");
  const add = useAddProjectMember();
  const remove = useRemoveProjectMember();

  const byId = new Map(directory.map((e) => [e.id, e]));
  const memberIds = new Set(project.members.map((m) => m.employee_id));
  // The manager is implicitly part of the project, so they are not offered as a member.
  const candidates = directory.filter((e) => e.id !== project.manager_id && !memberIds.has(e.id));

  async function handleAdd() {
    if (!selected) return;
    try {
      await add.mutateAsync({ projectId: project.id, employeeId: selected });
      toast.success("Member added.");
      setSelected("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add this member."));
    }
  }

  async function handleRemove(employeeId: string) {
    const label = employeeLabel(byId.get(employeeId));
    if (!window.confirm(`Remove ${label} from this project?`)) return;
    try {
      await remove.mutateAsync({ projectId: project.id, employeeId });
      toast.success("Member removed.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not remove this member."));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900">Team ({project.members.length})</h3>

      <ul className="mt-3 divide-y divide-slate-100">
        <li className="py-2 flex items-center justify-between text-sm">
          <span className="text-slate-900">{employeeLabel(byId.get(project.manager_id))}</span>
          <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">Manager</span>
        </li>
        {project.members.map((m) => {
          const emp = byId.get(m.employee_id);
          return (
            <li key={m.employee_id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <p className="text-slate-900">{employeeLabel(emp)}</p>
                {emp?.designation && <p className="text-xs text-slate-400">{emp.designation}</p>}
              </div>
              {isOwner && (
                <button
                  onClick={() => handleRemove(m.employee_id)}
                  disabled={remove.isPending}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {project.members.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">No members yet. Add employees to assign them tickets.</p>
      )}

      {isOwner && (
        <div className="mt-4 flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select an employee to add...</option>
            {candidates.map((e) => (
              <option key={e.id} value={e.id}>
                {employeeLabel(e)}
                {e.designation ? ` - ${e.designation}` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selected || add.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}
    </div>
  );
}