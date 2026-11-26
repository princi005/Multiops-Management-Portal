import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const sampleActivity = [
  { action: "Department settings viewed", actor: "Organization Admin", date: "Nov 26, 2026", category: "Settings" },
  { action: "Employee role updated", actor: "Organization Admin", date: "Nov 25, 2026", category: "Access" },
  { action: "Project member added", actor: "Manager", date: "Nov 24, 2026", category: "Projects" },
  { action: "Leave request reviewed", actor: "Manager", date: "Nov 24, 2026", category: "Requests" },
];

export default function OrganizationActivityPage() {
  const [query, setQuery] = useState("");
  const [retentionYears, setRetentionYears] = useState(1);
  const filteredActivity = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sampleActivity.filter((entry) =>
      !term || `${entry.action} ${entry.actor} ${entry.category}`.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <div className="min-h-screen">
      <PortalHeader title="Organization Activity" subtitle="Audit preview" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Administrative history</p>
          <h2 className="mt-2 text-3xl font-extrabold">Organization Activity</h2>
          <p className="mt-2 text-sm text-slate-500">Review organization-level activity and retention settings.</p>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-end sm:justify-between"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <label className="block text-sm font-semibold">
            Audit retention · preview
            <input type="number" min="1" max="50" value={retentionYears}
              onChange={(event) => setRetentionYears(Number(event.target.value))}
              className="mt-1 block w-full rounded-lg border p-2 sm:w-40"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>
          <label className="relative block sm:w-80">
            <span className="sr-only">Search organization activity</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity..."
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>
        </section>

        <section className="overflow-hidden rounded-2xl border shadow-sm"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="flex items-center gap-2 border-b p-5" style={{ borderColor: "var(--mo-border)" }}>
            <Activity className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <h3 className="font-bold">Recent activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.map((entry) => (
                  <tr key={`${entry.action}-${entry.date}`} className="border-t" style={{ borderColor: "var(--mo-border)" }}>
                    <td className="px-5 py-4 font-medium">{entry.action}</td>
                    <td className="px-5 py-4 text-slate-500">{entry.actor}</td>
                    <td className="px-5 py-4">{entry.category}</td>
                    <td className="px-5 py-4 text-slate-500">{entry.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredActivity.length === 0 && <p className="p-5 text-sm text-slate-500">No activity matches this search.</p>}
          </div>
          <p className="border-t p-4 text-xs text-slate-500" style={{ borderColor: "var(--mo-border)" }}>
            Sample audit rows only · the current audit API is not connected to this preview screen.
          </p>
        </section>
      </main>
    </div>
  );
}
