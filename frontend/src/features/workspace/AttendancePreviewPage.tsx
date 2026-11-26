import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, CheckCircle2, Clock3, Home, MapPin, ShieldAlert } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";

type RequestKind = "Regularization" | "Work from home" | "On duty" | "Partial day";
type PunchEvent = { id: number; label: string; time: string };

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: Date) {
  return value.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="rounded-2xl border p-5 shadow-sm"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </article>
  );
}

export default function AttendancePreviewPage() {
  const { data: user } = useCurrentUser();
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [shift, setShift] = useState("General · 9:00 AM – 6:00 PM");
  const [clockedInAt, setClockedInAt] = useState<Date | null>(null);
  const [punchEvents, setPunchEvents] = useState<PunchEvent[]>([]);
  const [activeRequest, setActiveRequest] = useState<RequestKind | null>(null);
  const [requestDate, setRequestDate] = useState(() => dateKey(new Date()));
  const [requestDetails, setRequestDetails] = useState("");
  const [escalateToHr, setEscalateToHr] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => {
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [now]);

  const elapsedMinutes = clockedInAt
    ? Math.max(0, Math.floor((now.getTime() - clockedInAt.getTime()) / 60_000))
    : 0;
  const elapsedLabel = clockedInAt
    ? `${String(Math.floor(elapsedMinutes / 60)).padStart(2, "0")}h ${String(elapsedMinutes % 60).padStart(2, "0")}m`
    : "—";

  function clockIn() {
    const time = new Date();
    setNow(time);
    setClockedInAt(time);
    setPunchEvents((events) => [...events, { id: Date.now(), label: "Clock in", time: formatTime(time) }]);
    setNotice("Clock-in action shown in this frontend preview.");
  }

  function clockOut() {
    const time = new Date();
    setNow(time);
    setClockedInAt(null);
    setPunchEvents((events) => [...events, { id: Date.now(), label: "Clock out", time: formatTime(time) }]);
    setNotice("Clock-out action shown in this frontend preview.");
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRequest) return;
    setNotice(`${activeRequest} request preview saved for ${requestDate}${escalateToHr ? " and marked for HR review" : ""}.`);
    setActiveRequest(null);
    setRequestDetails("");
  }

  const requests: Array<{ kind: RequestKind; description: string; icon: typeof CalendarDays }> = [
    { kind: "Regularization", description: "Correct a missing or incorrect punch.", icon: CalendarDays },
    { kind: "Work from home", description: "Request a WFH day.", icon: Home },
    { kind: "On duty", description: "Record approved off-site work.", icon: MapPin },
    { kind: "Partial day", description: "Request a partial-day schedule.", icon: Clock3 },
  ];

  return (
    <div className="min-h-screen">
      <PortalHeader title="Attendance" subtitle="Time & shifts" email={user?.email} accent="teal" />

      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">My workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Attendance</h1>
            <p className="mt-2 text-sm text-slate-500">Your shift, work hours, and attendance requests.</p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
            Frontend preview · demo data
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Attendance summary">
          <MetricCard label="Present days" value="18 days" note="Sample for this month" />
          <MetricCard label="Average work time" value="8h 12m" note="Sample monthly average" />
          <MetricCard label="Late arrivals" value="2" note="Sample monthly total" />
          <MetricCard label="Leave balance" value="12 days" note="Preview value" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <article className="rounded-[24px] border p-5 shadow-sm sm:p-7"
            style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)", boxShadow: "var(--mo-shadow)" }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Today</p>
                <h2 className="mt-1 text-xl font-bold">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
                <p className="mt-1 text-sm text-slate-500">{shift}</p>
              </div>
              <div className={`rounded-full px-3 py-1.5 text-xs font-bold ${clockedInAt ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                {clockedInAt ? "Clocked in" : "Not clocked in"}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!clockedInAt ? (
                <button type="button" onClick={clockIn}
                  className="rounded-xl bg-gradient-to-r from-violet-700 to-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-900/15 hover:brightness-105">
                  Clock in
                </button>
              ) : (
                <button type="button" onClick={clockOut}
                  className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">
                  Clock out
                </button>
              )}
              <div className="rounded-xl border px-4 py-2.5" style={{ borderColor: "var(--mo-border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Work time today</p>
                <p className="mt-0.5 text-lg font-extrabold">{elapsedLabel}</p>
              </div>
              <p className="text-xs text-slate-500">Current time: {now.toLocaleTimeString()}</p>
            </div>

            <div className="mt-6 rounded-2xl bg-violet-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Weekly shift selector</p>
                  <p className="mt-1 text-xs text-slate-600">Select a day to review its shift.</p>
                </div>
                <select value={shift} onChange={(event) => setShift(event.target.value)}
                  className="max-w-full rounded-lg border bg-white px-3 py-2 text-xs font-semibold">
                  <option>General · 9:00 AM – 6:00 PM</option>
                  <option>Early · 7:00 AM – 4:00 PM</option>
                  <option>Late · 1:00 PM – 10:00 PM</option>
                  <option>Custom shift</option>
                </select>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                {weekDays.map((day) => {
                  const key = dateKey(day);
                  const selected = key === selectedDate;
                  const today = key === dateKey(now);
                  return (
                    <button key={key} type="button" onClick={() => setSelectedDate(key)}
                      aria-pressed={selected}
                      className={`rounded-xl border px-2 py-3 text-center ${selected ? "border-violet-600 bg-violet-700 text-white shadow-md" : "border-violet-100 bg-white/80 text-slate-700 hover:border-violet-300"}`}>
                      <span className="block text-[10px] font-bold uppercase">{day.toLocaleDateString(undefined, { weekday: "short" })}</span>
                      <span className="mt-1 block text-sm font-extrabold">{day.getDate()}</span>
                      {today && <span className={`mt-1 block text-[9px] font-bold ${selected ? "text-violet-100" : "text-violet-700"}`}>TODAY</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="rounded-[24px] border p-5 shadow-sm sm:p-7"
            style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)", boxShadow: "var(--mo-shadow)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Shift schedule</p>
                <h2 className="mt-1 text-xl font-bold">Daily timeline</h2>
              </div>
              <span className="rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800">9:00 AM – 6:00 PM</span>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span>
              </div>
              <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="w-[38%] bg-gradient-to-r from-violet-500 to-violet-700" />
                <div className="w-[12%] bg-amber-200" />
                <div className="w-[50%] bg-gradient-to-r from-cyan-500 to-cyan-600" />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>Work</span><span>Break</span><span>Work</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {punchEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500"
                  style={{ borderColor: "var(--mo-border)" }}>
                  No punch recorded in this preview yet. Use Clock in to add a sample punch.
                </div>
              ) : punchEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: "var(--mo-border)" }}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="flex-1 text-sm font-semibold">{event.label}</span>
                  <time className="text-xs text-slate-500">{event.time}</time>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs text-slate-500">Selected day: {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}</p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <article className="rounded-[24px] border p-5 shadow-sm sm:p-7"
            style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Attendance requests</p>
            <h2 className="mt-1 text-xl font-bold">Need a correction or schedule update?</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {requests.map(({ kind, description, icon: Icon }) => (
                <button key={kind} type="button" onClick={() => { setActiveRequest(kind); setRequestDate(selectedDate); setNotice(""); }}
                  className="rounded-xl border p-3 text-left transition hover:border-violet-300 hover:bg-violet-50/60"
                  style={{ borderColor: "var(--mo-border)" }}>
                  <Icon className="h-4 w-4 text-violet-700" />
                  <span className="mt-2 block text-sm font-bold">{kind}</span>
                  <span className="mt-1 block text-xs text-slate-500">{description}</span>
                </button>
              ))}
            </div>
            {notice && <p role="status" className="mt-4 text-sm text-emerald-700">{notice}</p>}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Attendance issues can be escalated to HR. These preview requests are not submitted to a server.</span>
            </div>
          </article>

          <article className="rounded-[24px] border p-5 shadow-sm sm:p-7"
            style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-500">Daily logs</p>
                <h2 className="mt-1 text-xl font-bold">Recent attendance</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Sample data</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-3">Date</th><th className="py-3">Shift</th><th className="py-3">Work hours</th><th className="py-3">Status</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Yesterday", "9:00 AM – 6:00 PM", "8h 04m", "Present"],
                    ["Monday", "9:00 AM – 6:00 PM", "8h 16m", "Present"],
                    ["Friday", "9:00 AM – 6:00 PM", "7h 52m", "Regularized"],
                  ].map(([day, hours, work, status]) => (
                    <tr key={day} className="border-t" style={{ borderColor: "var(--mo-border)" }}>
                      <td className="py-3 font-semibold">{day}</td>
                      <td className="py-3 text-slate-500">{hours}</td>
                      <td className="py-3">{work}</td>
                      <td className="py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">{status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>

      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveRequest(null); }}>
          <form onSubmit={submitRequest} role="dialog" aria-modal="true" aria-labelledby="attendance-request-title"
            className="w-full max-w-lg space-y-4 rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Attendance request preview</p>
              <h2 id="attendance-request-title" className="mt-1 text-xl font-bold">{activeRequest}</h2>
            </div>
            <label className="block text-sm font-semibold">Date
              <input required type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)}
                className="mt-1 block w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="block text-sm font-semibold">Details
              <textarea required rows={4} value={requestDetails} onChange={(event) => setRequestDetails(event.target.value)}
                placeholder="Add the reason and any details for HR or your manager."
                className="mt-1 block w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--mo-border)" }}>
              <input type="checkbox" checked={escalateToHr} onChange={(event) => setEscalateToHr(event.target.checked)} />
              <span><strong>Escalate to HR</strong><span className="block text-xs text-slate-500">Preview choice only; this request is not sent to HR.</span></span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveRequest(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white">Save preview request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

