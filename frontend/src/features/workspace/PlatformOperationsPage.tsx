import { Database, KeyRound, Server, ShieldCheck } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const operationAreas = [
  { name: "Application services", detail: "Service health and release information.", icon: Server, status: "Preview" },
  { name: "Database operations", detail: "Future administrative database tooling.", icon: Database, status: "Not connected" },
  { name: "Credential verification", detail: "Future verification and access review controls.", icon: KeyRound, status: "Not connected" },
  { name: "Platform security", detail: "Future platform access and security overview.", icon: ShieldCheck, status: "Preview" },
];

export default function PlatformOperationsPage() {
  return (
    <div className="min-h-screen">
      <PortalHeader title="Platform Operations" subtitle="Platform Admin" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Operations console preview</p>
          <h2 className="mt-2 text-3xl font-extrabold">Platform Operations</h2>
          <p className="mt-2 text-sm text-slate-500">A future operations overview for platform services and access controls.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {operationAreas.map((area) => {
            const Icon = area.icon;
            return (
              <article key={area.name} className="rounded-2xl border p-5 shadow-sm"
                style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{area.status}</span>
                </div>
                <h3 className="mt-4 font-bold">{area.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{area.detail}</p>
              </article>
            );
          })}
        </section>

        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Frontend preview only · this screen does not expose source code, database credentials, or operational controls.
        </p>
      </main>
    </div>
  );
}
