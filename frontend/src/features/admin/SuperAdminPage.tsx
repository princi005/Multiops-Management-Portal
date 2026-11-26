import { useState } from "react";
import "./AdminPages.css";
import PortalHeader from "../../components/PortalHeader";
import { useCreateOrganization, usePlatformOrganizations, useUpdatePlatformOrganization } from "../../hooks/useOrganizations";
import PlatformAuditPanel from "./PlatformAuditPanel";

export default function SuperAdminPage() {
  const organizations = usePlatformOrganizations();
  const create = useCreateOrganization();
  const update = useUpdatePlatformOrganization();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminId, setAdminId] = useState("");
  const [domain, setDomain] = useState("");
  const [notice, setNotice] = useState("");

  return <>
    <PortalHeader title="Super Admin" subtitle="Platform operations" accent="violet" showProfile={false} />
    <main className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">MultiOps · Platform Operations</p>
        <h1 className="mt-2 text-3xl font-bold">Super Admin</h1>
        <p className="mt-2 text-slate-600">Onboard clients and manage domains, subscriptions, and active status.</p>
      </header>

      <form className="grid gap-4 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        create.mutate(
          { name, slug, initial_admin_user_id: adminId, domain: domain || undefined },
          {
            onSuccess: () => { setNotice("Organization created."); setName(""); setSlug(""); setAdminId(""); setDomain(""); },
            onError: () => setNotice("Creation failed. Check the admin UUID, slug, and domain."),
          },
        );
      }}>
        <label className="text-sm">
          Company name
          <input required value={name} onChange={(event) => setName(event.target.value)}
            className="mt-1 block w-full rounded-lg border p-3" />
        </label>

        <label className="text-sm">
          Workspace URL slug
          <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Use lowercase letters, numbers, and single hyphens, for example acme-india."
            value={slug} onChange={(event) => setSlug(event.target.value)}
            className="mt-1 block w-full rounded-lg border p-3" />
          <span className="mt-1 block text-xs text-slate-500">Use a short name such as acme or acme-india, not a full URL.</span>
        </label>

        <label className="text-sm">
          Initial Organization Admin user UUID
          <input required value={adminId} onChange={(event) => setAdminId(event.target.value)}
            className="mt-1 block w-full rounded-lg border p-3" />
        </label>

        <label className="text-sm">
          Company domain
          <input value={domain} placeholder="acme.multiops.com"
            onChange={(event) => setDomain(event.target.value)}
            className="mt-1 block w-full rounded-lg border p-3" />
          <span className="mt-1 block text-xs text-slate-500">Enter the hostname without https://, for example acme.multiops.com.</span>
        </label>

        <div className="flex items-end gap-3">
          <button disabled={create.isPending} className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white">
            {create.isPending ? "Creating…" : "Create organization"}
          </button>
          <span role="status">{notice}</span>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <h2 className="border-b p-5 text-lg font-semibold">Client organizations</h2>
        {organizations.isLoading ? <p className="p-5">Loading…</p> :
          organizations.isError ? <p className="p-5">Platform Admin access is required.</p> :
          <div className="divide-y">{organizations.data?.map((organization) => (
            <article key={organization.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
              <div>
                <h3 className="font-semibold">{organization.name}</h3>
                <p className="text-sm text-slate-500">{organization.slug} · {organization.domain || "No domain"}</p>
              </div>
              <label className="text-xs text-slate-500">
                Plan
                <select value={organization.subscription_plan}
                  onChange={(event) => update.mutate({ id: organization.id, subscription_plan: event.target.value })}
                  className="mt-1 block rounded-lg border p-2">
                  <option>trial</option><option>starter</option><option>business</option><option>enterprise</option>
                </select>
              </label>
              <label className="text-xs text-slate-500">
                Status
                <select value={organization.subscription_status}
                  onChange={(event) => update.mutate({ id: organization.id, subscription_status: event.target.value })}
                  className="mt-1 block rounded-lg border p-2">
                  <option>trial</option><option>active</option><option>past_due</option><option>suspended</option><option>cancelled</option>
                </select>
              </label>
              <button type="button" onClick={() => update.mutate({ id: organization.id, is_active: !organization.is_active })}
                className="rounded-lg border px-3 py-2 text-sm">
                {organization.is_active ? "Deactivate site" : "Reactivate site"}
              </button>
            </article>
          ))}</div>}
      </section>

      <PlatformAuditPanel />
    </main>
  </>;
}
