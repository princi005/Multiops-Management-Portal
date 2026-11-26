import type { DocumentCategory, DocumentFilter } from "./types";

const categories: DocumentCategory[] = [
  "HR Policies",
  "Code of Conduct",
  "Leave & Attendance",
  "Accounts",
  "IT & Security",
  "Onboarding & Offboarding",
];

export default function DocumentCategoryTabs({
  value,
  onChange,
}: {
  value: DocumentFilter;
  onChange: (value: DocumentFilter) => void;
}) {
  const filters: DocumentFilter[] = ["All", ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter documents by category">
      {filters.map((category) => (
        <button key={category} type="button" aria-pressed={value === category}
          onClick={() => onChange(category)}
          className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${
            value === category
              ? "bg-violet-700 text-white shadow-sm"
              : "border border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
          }`}>
          {category}
        </button>
      ))}
    </div>
  );
}
