import type { PostFilter } from "./types";

const options: Array<{ id: PostFilter; label: string }> = [
  { id: "all", label: "Company feed" },
  { id: "announcements", label: "Announcements" },
  { id: "recognition", label: "Recognition" },
  { id: "private", label: "Private appreciation" },
];

export default function PostFilters({
  value,
  onChange,
}: {
  value: PostFilter;
  onChange: (filter: PostFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter posts">
      {options.map((option) => (
        <button key={option.id} type="button" aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
            value === option.id
              ? "bg-violet-700 text-white shadow-sm"
              : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
          }`}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
