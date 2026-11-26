import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Video } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import PlannerWeekStrip from "./planner/PlannerWeekStrip";
import type { PlannerEvent } from "./planner/types";

type Meeting = PlannerEvent & {
  host: string;
  platform: "Zoom" | "In person";
};

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

function createMeetings(): Meeting[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return [
    {
      id: "meeting-team-sync",
      date: dateKey(today),
      title: "Team check-in",
      time: "10:00 AM",
      host: "Your team",
      platform: "Zoom",
    },
    {
      id: "meeting-project-review",
      date: dateKey(today),
      title: "Project review",
      time: "2:30 PM",
      host: "Project team",
      platform: "Zoom",
    },
    {
      id: "meeting-one-to-one",
      date: dateKey(tomorrow),
      title: "Weekly one-to-one",
      time: "11:00 AM",
      host: "Your manager",
      platform: "In person",
    },
  ];
}

export default function MyMeetingsPage() {
  const { data: user } = useCurrentUser();
  const week = useMemo(createWeek, []);
  const [meetings] = useState(createMeetings);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));

  const selectedMeetings = meetings
    .filter((meeting) => meeting.date === selectedDate)
    .sort((left, right) => left.time.localeCompare(right.time));

  return (
    <div className="min-h-screen">
      <PortalHeader
        title="My Meetings"
        subtitle="Calendar & video meetings"
        email={user?.email}
        accent="violet"
      />

      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
              My workspace
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">My Meetings</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              View your scheduled meetings and open the connected meeting service.
            </p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-100">
            Frontend preview · sample meetings
          </span>
        </header>

        <SurfaceCard>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            <h3 className="text-lg font-bold">Weekly calendar</h3>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Organization calendar connection and meeting data will be configured in a later phase.
          </p>
          <div className="mt-5">
            <PlannerWeekStrip
              days={week}
              selectedDate={selectedDate}
              events={meetings}
              onSelect={setSelectedDate}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            <h3 className="text-lg font-bold">
              Meetings on {new Date(`${selectedDate}T00:00:00`).toLocaleDateString()}
            </h3>
          </div>

          {selectedMeetings.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-slate-600 dark:text-slate-300" style={{ borderColor: "var(--mo-border)" }}>
              No meetings scheduled for this day in the preview.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedMeetings.map((meeting) => (
                <article
                  key={meeting.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4"
                  style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">
                      <Video className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="font-bold">{meeting.title}</h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {meeting.time} · Hosted by {meeting.host}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{meeting.platform}</p>
                    </div>
                  </div>

                  {meeting.platform === "Zoom" && (
                    <>
                      <a
                        href="https://zoom.us/"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800"
                      >
                        Open Zoom
                      </a>
                      <p className="w-full text-right text-xs text-slate-500">Preview link opens Zoom; a meeting-specific invite URL is not connected yet.</p>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </SurfaceCard>
      </main>
    </div>
  );
}
