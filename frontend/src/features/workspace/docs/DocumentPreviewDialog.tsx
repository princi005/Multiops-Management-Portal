import { Download, FileText, X } from "lucide-react";
import type { CompanyDocument } from "./types";

export default function DocumentPreviewDialog({
  document,
  onClose,
}: {
  document: CompanyDocument | null;
  onClose: () => void;
}) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="document-preview-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
        style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
        <header className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: "var(--mo-border)" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">{document.category}</p>
              <h2 id="document-preview-title" className="mt-1 text-lg font-extrabold">{document.title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close document preview"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>
        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">{document.summary}</p>
          <div className="min-h-48 rounded-xl border border-dashed p-5" style={{ borderColor: "var(--mo-border)" }}>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{document.previewText}</p>
            <p className="mt-5 text-xs text-slate-400">File: {document.fileName}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Owner: {document.owner} · Updated: {document.updatedAt}</p>
            <button type="button" disabled className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold text-slate-400">
              <Download className="h-4 w-4" /> Download unavailable in preview
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
