import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ListTodo, NotebookPen } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import AppButton from "../../components/ui/AppButton";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import type { PlannerEvent, PlannerTask } from "./planner/types";
import PlannerIntegrationsPanel from "./planner/PlannerIntegrationsPanel";
import PlannerNotesPanel from "./planner/PlannerNotesPanel";
import PlannerTaskList from "./planner/PlannerTaskList";
import PlannerWeekStrip from "./planner/PlannerWeekStrip";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createWeek() {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

export default function PlannerPreviewPage({ embedded = false }: { embedded?: boolean }) {
  const { data: user } = useCurrentUser();
  const weekDays = useMemo(createWeek, []);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<PlannerTask[]>(() => {
    const today = dateKey(new Date());
    return [
      { id: "task-1", title: "Review project updates", dueDate: today, completed: false },
      { id: "task-2", title: "Prepare for the team meeting", dueDate: today, completed: false },
      { id: "task-3", title: "Update weekly priorities", dueDate: "", completed: true },
    ];
  });
  const [events] = useState<PlannerEvent[]>(() => {
    const today = dateKey(new Date());
    return [
      { id: "event-1", date: today, title: "Team check-in", time: "10:00 AM" },
      { id: "event-2", date: today, title: "Project planning", time: "2:30 PM" },
    ];
  });

  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const completedTasks = tasks.filter((task) => task.completed).length;

  function addTask(title: string, dueDate: string) {
    setTasks((items) => [...items, { id: String(Date.now()), title, dueDate, completed: false }]);
  }

  function toggleTask(taskId: string) {
    setTasks((items) => items.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    ));
  }

  function toggleProvider(providerId: string) {
    setConnectedIds((items) => items.includes(providerId)
      ? items.filter((id) => id !== providerId)
      : [...items, providerId]);
  }

  return (
    <div className="min-h-screen">
      {!embedded && <PortalHeader title="Planner" subtitle="Calendar & planning" email={user?.email} accent="violet" />}

      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">My workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{embedded ? "My Tickets" : "Planner"}</h1>
            <p className="mt-2 text-sm text-slate-500">Your calendar, tasks, notes, and connected work apps.</p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
            Frontend preview · demo data
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Open tasks", value: String(tasks.length - completedTasks), icon: ListTodo },
            { label: "Completed", value: String(completedTasks), icon: CheckCircle2 },
            { label: "Today's events", value: String(events.filter((event) => event.date === dateKey(new Date())).length), icon: CalendarDays },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border p-5 shadow-sm"
              style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <Icon className="h-5 w-5 text-violet-700" />
              </div>
              <p className="mt-2 text-2xl font-extrabold">{value}</p>
            </article>
          ))}
        </section>

        <SurfaceCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-violet-700" />
                <h2 className="text-lg font-bold">Weekly calendar</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">Choose a day to view its events.</p>
            </div>
            <AppButton type="button" variant="ghost" onClick={() => setSelectedDate(dateKey(new Date()))}>Today</AppButton>
          </div>
          <div className="mt-5">
            <PlannerWeekStrip days={weekDays} selectedDate={selectedDate} events={events} onSelect={setSelectedDate} />
          </div>
          <div className="mt-5 divide-y" style={{ borderColor: "var(--mo-border)" }}>
            {selectedEvents.length ? selectedEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-3">
                <span className="rounded-lg bg-cyan-50 px-2.5 py-1.5 text-xs font-bold text-cyan-800">{event.time}</span>
                <span className="text-sm font-semibold">{event.title}</span>
              </div>
            )) : <p className="py-4 text-sm text-slate-500">No preview events on this day.</p>}
          </div>
          <p className="mt-3 text-xs text-slate-500">Google Calendar, Microsoft Outlook Calendar, and Zoho Calendar are shown below as separate provider previews.</p>
        </SurfaceCard>

        <section className="grid gap-5 xl:grid-cols-2">
          <SurfaceCard>
            <div className="mb-4 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-violet-700" />
              <h2 className="text-lg font-bold">My tasks</h2>
            </div>
            <PlannerTaskList tasks={tasks} onAdd={addTask} onToggle={toggleTask} />
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-4 flex items-center gap-2">
              <NotebookPen className="h-5 w-5 text-violet-700" />
              <h2 className="text-lg font-bold">Personal notes</h2>
            </div>
            <PlannerNotesPanel value={notes} onChange={setNotes} />
          </SurfaceCard>
        </section>

        <SurfaceCard>
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-700">Independent integrations</p>
            <h2 className="mt-1 text-lg font-bold">Connected work apps</h2>
            <p className="mt-1 text-sm text-slate-500">Provider cards can open their service. Connect buttons only change this preview.</p>
          </div>
          <PlannerIntegrationsPanel connectedIds={connectedIds} onToggle={toggleProvider} />
        </SurfaceCard>

        <p className="text-center text-xs text-slate-500">Tasks, notes, calendar events, and connection states are preview data and are not saved to your account.</p>
      </main>
    </div>
  );
}





