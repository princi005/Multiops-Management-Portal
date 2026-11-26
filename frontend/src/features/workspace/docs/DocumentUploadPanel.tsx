import { useState } from "react";
import type { FormEvent } from "react";
import { Upload } from "lucide-react";
import AppButton from "../../../components/ui/AppButton";
import type { CompanyDocument, DocumentCategory } from "./types";

const categories: DocumentCategory[] = [
  "HR Policies",
  "Code of Conduct",
  "Leave & Attendance",
  "Accounts",
  "IT & Security",
  "Onboarding & Offboarding",
];

export default function DocumentUploadPanel({
  onAdd,
}: {
  onAdd: (document: CompanyDocument) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("HR Policies");
  const [fileName, setFileName] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !fileName) {
      setNotice("Add a document title and select a file for the preview.");
      return;
    }

    onAdd({
      id: `local-${Date.now()}`,
      title: title.trim(),
      category,
      summary: "Local upload preview. The file has not been sent to the server.",
      previewText: "Document content preview is unavailable until document storage is connected.",
      updatedAt: "Just now · local preview",
      owner: "Current user",
      fileName,
      isPreview: true,
    });
    setTitle("");
    setFileName("");
    setNotice("Added to this page preview only. The file is not uploaded or saved.");
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
      <label className="text-xs font-bold text-slate-600">Document title
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Policy or document name"
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm" />
      </label>
      <label className="text-xs font-bold text-slate-600">Category
        <select value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory)}
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold text-slate-600">Choose file
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" />
      </label>
      <div className="flex items-end">
        <AppButton type="submit" variant="primary"><Upload className="h-4 w-4" />Add preview</AppButton>
      </div>
      {notice && <p role="status" className="text-xs text-slate-500 md:col-span-4">{notice}</p>}
    </form>
  );
}
