import { usePlatformAudit } from "../../hooks/useOrganizations";

export default function PlatformAuditPanel() {
  const audit = usePlatformAudit();

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold">Platform activity</h2>
        <p className="mt-1 text-sm text-slate-500">Recent organization onboarding, settings, membership, and subscription changes.</p>
      </div>
      {audit.isLoading ? <p className="p-5 text-sm">Loading activity…</p> :
        audit.isError ? <p className="p-5 text-sm text-red-700">Could not load platform activity.</p> :
        audit.data?.length ? (
          <div className="divide-y">
            {audit.data.map((item) => (
              <article key={item.id} className="grid gap-1 p-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold text-slate-900">{item.action.replaceAll(".", " ")}</p>
                  <p className="text-sm text-slate-600">{item.organization_name}</p>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    Actor: {item.actor_user_id ?? "System"} · Event: {item.id}
                  </p>
                </div>
                <time className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</time>
              </article>
            ))}
          </div>
        ) : <p className="p-5 text-sm text-slate-500">No platform activity recorded yet.</p>}
    </section>
  );
}
