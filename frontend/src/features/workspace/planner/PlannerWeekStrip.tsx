import type { PlannerEvent } from "./types";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PlannerWeekStrip({
  days,
  selectedDate,
  events,
  onSelect,
}: {
  days: Date[];
  selectedDate: string;
  events: PlannerEvent[];
  onSelect: (date: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const key = dateKey(day);
        const selected = key === selectedDate;
        const eventCount = events.filter((event) => event.date === key).length;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={selected}
            className={`rounded-xl border px-2 py-3 text-center transition ${
              selected
                ? "border-violet-700 bg-violet-700 text-white shadow-md"
                : "border-slate-200 bg-white/80 text-slate-700 hover:border-violet-300"
            }`}
          >
            <span className="block text-[10px] font-bold uppercase">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </span>
            <span className="mt-1 block text-base font-extrabold">{day.getDate()}</span>
            <span className={`mt-1 block text-[10px] ${selected ? "text-violet-100" : "text-slate-400"}`}>
              {eventCount ? `${eventCount} event${eventCount === 1 ? "" : "s"}` : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
