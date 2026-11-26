import { Files } from "lucide-react";

export default function DocumentEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="col-span-full flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center"
      style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-surface)" }}>
      <Files className="h-8 w-8 text-violet-600" />
      <h2 className="mt-3 font-bold">{filtered ? "No matching documents" : "No documents available"}</h2>
      <p className="mt-1 text-sm text-slate-500">{filtered ? "Change the category or search term." : "Company documents will appear here when added."}</p>
    </div>
  );
}
