import { useMemo, useState } from "react";
import { BookOpen, FilePlus2, ShieldCheck } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import DocumentCard from "./docs/DocumentCard";
import DocumentCategoryTabs from "./docs/DocumentCategoryTabs";
import DocumentEmptyState from "./docs/DocumentEmptyState";
import DocumentPreviewDialog from "./docs/DocumentPreviewDialog";
import DocumentSearch from "./docs/DocumentSearch";
import DocumentUploadPanel from "./docs/DocumentUploadPanel";
import { initialDocuments } from "./docs/documentCatalog";
import type { CompanyDocument, DocumentFilter } from "./docs/types";

export default function DocsPage() {
  const { data: user } = useCurrentUser();
  const [documents, setDocuments] = useState<CompanyDocument[]>(initialDocuments);
  const [category, setCategory] = useState<DocumentFilter>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CompanyDocument | null>(null);

  const canPreviewUpload = Boolean(
    user?.organization_roles.includes("org_admin") ||
    user?.roles.includes("HR") ||
    user?.roles.includes("Accounts"),
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return documents.filter((document) => {
      const matchesCategory = category === "All" || document.category === category;
      const matchesQuery =
        !needle ||
        `${document.title} ${document.summary} ${document.category} ${document.owner}`
          .toLocaleLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [documents, category, query]);

  function addDocument(document: CompanyDocument) {
    setDocuments((items) => [document, ...items]);
  }

  return (
    <div className="min-h-screen">
      <PortalHeader title="Docs" subtitle="Company library" email={user?.email} accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">My workspace</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight">
              <BookOpen className="h-8 w-8 text-violet-700" />Docs
            </h1>
            <p className="mt-2 text-sm text-slate-500">A central library for company policies and shared guidance.</p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
            Frontend preview · sample catalog
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["HR & workplace", "POSH, code of conduct, onboarding"],
            ["Time & attendance", "Leave, shifts, and attendance guidance"],
            ["Finance & technology", "Payroll, expenses, IT, and security"],
          ].map(([title, description]) => (
            <article key={title} className="rounded-2xl border p-5 shadow-sm"
              style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
              <p className="text-sm font-bold">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </article>
          ))}
        </section>

        {canPreviewUpload && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FilePlus2 className="h-5 w-5 text-violet-700" />
              <h2 className="font-bold">Add a document preview</h2>
            </div>
            <DocumentUploadPanel onAdd={addDocument} />
          </section>
        )}

        <SurfaceCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Company library</h2>
              <p className="mt-1 text-sm text-slate-500">{documents.length} preview entries</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />Organization-managed library
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <DocumentSearch value={query} onChange={setQuery} />
            <DocumentCategoryTabs value={category} onChange={setCategory} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.length === 0 ? (
                <DocumentEmptyState filtered={documents.length > 0} />
              ) : filtered.map((document) => (
                <DocumentCard key={document.id} document={document} onOpen={() => setSelected(document)} />
              ))}
            </div>
          </div>
        </SurfaceCard>

        <p className="text-center text-xs text-slate-500">The catalog and selected upload filenames are page-local previews. No files are uploaded, retained, or downloaded yet.</p>
      </main>

      <DocumentPreviewDialog document={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

