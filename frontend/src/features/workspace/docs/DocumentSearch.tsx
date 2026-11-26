import { Search } from "lucide-react";

export default function DocumentSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block w-full max-w-lg">
      <span className="sr-only">Search company documents</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)}
        placeholder="Search policies and documents"
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
    </label>
  );
}
