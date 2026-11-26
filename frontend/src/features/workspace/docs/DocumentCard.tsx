import { FileText } from "lucide-react";
import type { CompanyDocument } from "./types";

export default function DocumentCard({
  document,
  onOpen,
}: {
  document: CompanyDocument;
  onOpen: () => void;
}) {
  return (
    <article className="flex min-h-56 flex-col rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
          <FileText className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">Preview</span>
      </div>
      <p className="mt-4 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">{document.category}</p>
      <h2 className="mt-1 text-base font-bold">{document.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-5 text-slate-500">{document.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: "var(--mo-border)" }}>
        <span className="truncate text-xs text-slate-500">{document.owner} · {document.updatedAt}</span>
        <button type="button" onClick={onOpen} className="shrink-0 rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-50">
          View
        </button>
      </div>
    </article>
  );
}
