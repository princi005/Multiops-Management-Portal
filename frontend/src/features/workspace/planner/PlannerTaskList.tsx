import { useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import AppButton from "../../../components/ui/AppButton";
import type { PlannerTask } from "./types";

export default function PlannerTaskList({
  tasks,
  onAdd,
  onToggle,
}: {
  tasks: PlannerTask[];
  onAdd: (title: string, dueDate: string) => void;
  onToggle: (taskId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "completed">("all");
  const visibleTasks = tasks.filter((task) => taskFilter === "all" || (taskFilter === "completed" ? task.completed : !task.completed));

  function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), dueDate);
    setTitle("");
    setDueDate("");
  }

  return (
    <div>
      <form onSubmit={submitTask} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task…"
          aria-label="New task title"
          className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          aria-label="Task due date"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        />
        <AppButton type="submit" variant="primary">
          <Plus className="h-4 w-4" /> Add
        </AppButton>
      </form>

      <div className="mt-4 flex gap-2" role="group" aria-label="Filter planner tasks">
        {(["all", "open", "completed"] as const).map((filter) => (
          <button key={filter} type="button" aria-pressed={taskFilter === filter} onClick={() => setTaskFilter(filter)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${taskFilter === filter ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 text-slate-600"}`}>
            {filter}
          </button>
        ))}
      </div>
      <div className="mt-4 divide-y" style={{ borderColor: "var(--mo-border)" }}>
        {visibleTasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onToggle(task.id)}
            className="flex w-full items-start gap-3 py-3 text-left"
          >
            {task.completed
              ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${task.completed ? "text-slate-400 line-through" : ""}`}>{task.title}</span>
              <span className="mt-1 block text-xs text-slate-500">{task.dueDate ? `Due ${task.dueDate}` : "No due date"}</span>
            </span>
          </button>
        ))}
        {tasks.length === 0 && <p className="py-5 text-sm text-slate-500">No tasks yet. Add one above.</p>}
      </div>
    </div>
  );
}
