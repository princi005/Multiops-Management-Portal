import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const sampleEvents = [
  { action: "Client organization created", organization: "MultiOps Demo", actor: "Platform Admin", date: "Nov 26, 2026" },
  { action: "Subscription status reviewed", organization: "MultiOps Demo", actor: "Platform Admin", date: "Nov 25, 2026" },
  { action: "Organization Admin invited", organization: "Northwind Sample", actor: "Platform Admin", date: "Nov 24, 2026" },
];

export default function PlatformActivityPage() {
  const [query, setQuery] = useState("");
  const events = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sampleEvents.filter((event) =>
      !term || `${event.action} ${event.organization} ${event.actor}`.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <div className="min-h-screen">
      <PortalHeader title="Platform Activity" subtitle="Platform Admin" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Platform audit preview</p>
          <h2 className="mt-2 text-3xl font-extrabold">Platform Activity</h2>
          <p className="mt-2 text-sm text-slate-500">Review sample onboarding, admin membership, and subscription events.</p>
        </section>

        <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <label className="relative block max-w-md">
            <span className="sr-only">Search platform activity</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="flex items-center gap-2 border-b p-5" style={{ borderColor: "var(--mo-border)" }}>
            <Activity className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <h3 className="font-bold">Recent platform events</h3>
          </div>
          {events.length ? (
            <div className="divide-y" style={{ borderColor: "var(--mo-border)" }}>
              {events.map((event) => (
                <article key={`${event.action}-${event.date}`} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <h4 className="font-semibold">{event.action}</h4>
                    <p className="mt-1 text-sm text-slate-500">{event.organization} · {event.actor}</p>
                  </div>
                  <time className="text-sm text-slate-500">{event.date}</time>
                </article>
              ))}
            </div>
          ) : <p className="p-5 text-sm text-slate-500">No events match the search.</p>}
          <p className="border-t p-4 text-xs text-slate-500" style={{ borderColor: "var(--mo-border)" }}>
            Sample events only · platform audit data is not connected to this preview.
          </p>
        </section>
      </main>
    </div>
  );
}
