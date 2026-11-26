import { useState } from "react";
import { Globe, Plus } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

type DomainEntry = {
  organization: string;
  domain: string;
  status: "Active" | "Verification needed";
};

export default function PlatformDomainsPage() {
  const [domains, setDomains] = useState<DomainEntry[]>([
    { organization: "MultiOps Demo", domain: "multiops-demo.example.com", status: "Verification needed" },
  ]);
  const [organization, setOrganization] = useState("");
  const [domain, setDomain] = useState("");

  function addDomain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization.trim() || !domain.trim()) return;
    setDomains((items) => [...items, {
      organization: organization.trim(),
      domain: domain.trim(),
      status: "Verification needed",
    }]);
    setOrganization("");
    setDomain("");
  }

  return (
    <div className="min-h-screen">
      <PortalHeader title="Domains & Sites" subtitle="Platform Admin" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Client administration</p>
          <h2 className="mt-2 text-3xl font-extrabold">Domains & Sites</h2>
          <p className="mt-2 text-sm text-slate-500">Review client domains and prepare domain verification.</p>
        </section>

        <form onSubmit={addDomain} className="grid gap-3 rounded-2xl border p-5 md:grid-cols-[1fr_1fr_auto]"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <label className="text-sm font-medium">Organization
            <input required value={organization} onChange={(event) => setOrganization(event.target.value)}
              placeholder="Company name" className="mt-1 block w-full rounded-lg border p-2"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>
          <label className="text-sm font-medium">Domain
            <input required value={domain} onChange={(event) => setDomain(event.target.value)}
              placeholder="company.example.com" className="mt-1 block w-full rounded-lg border p-2"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>
          <button type="submit" className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />Add preview
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl border"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="border-b p-5" style={{ borderColor: "var(--mo-border)" }}>
            <h3 className="font-bold">Client domains</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--mo-border)" }}>
            {domains.map((entry) => (
              <article key={`${entry.organization}-${entry.domain}`} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-violet-700" aria-hidden="true" />
                  <div>
                    <h4 className="font-semibold">{entry.organization}</h4>
                    <p className="mt-1 text-sm text-slate-500">{entry.domain}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{entry.status}</span>
              </article>
            ))}
          </div>
          <p className="border-t p-4 text-xs text-slate-500" style={{ borderColor: "var(--mo-border)" }}>
            Preview only · domain ownership checks and DNS provisioning are not connected.
          </p>
        </section>
      </main>
    </div>
  );
}
