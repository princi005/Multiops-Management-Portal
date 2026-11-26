import { useEffect, useState } from "react";
import "./AdminPages.css";
import RolePermissionEditor from "./RolePermissionEditor";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
  useAddOrganizationMember,
  useMyOrganizations,
  useOrganizationAudit,
  useOrganizationMembers,
  useOrganizationSettings,
  useSaveOrganizationSettings,
  useUpdateOrganizationMember,
} from "../../hooks/useOrganizations";
import type { OrganizationConfig } from "../../types/organization";

const defaults: OrganizationConfig = {
  company_prefix: "MTO",
  departments: [],
  roles: [],
  features: {},
  priorities: ["low", "normal", "high", "urgent"],
  inbox_retention_days: 15,
  audit_retention_years: 1,
  employee_id_format: "{company}-{department}-{number}",
  legal_name_approvers: ["HR"],
};

export default function OrganizationAdminPage() {
  const { data: currentUser } = useCurrentUser();
  const organizations = useMyOrganizations();
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [notice, setNotice] = useState("");

  const settings = useOrganizationSettings(orgId || undefined);
  const members = useOrganizationMembers(orgId || undefined);
  const audit = useOrganizationAudit(orgId || undefined);
  const save = useSaveOrganizationSettings(orgId);
  const addMember = useAddOrganizationMember(orgId);
  const updateMember = useUpdateOrganizationMember(orgId);
  const [config, setConfig] = useState<OrganizationConfig>(defaults);

  useEffect(() => {
    const firstAdminOrg = organizations.data?.find((item) => item.role === "org_admin");
    if (firstAdminOrg && !orgId) setOrgId(firstAdminOrg.organization.id);
  }, [organizations.data, orgId]);

  useEffect(() => {
    if (settings.data) setConfig(settings.data);
  }, [settings.data]);

  const enabledRoles = config.roles.filter((role) =>
    role.enabled !== false && role.name.trim().toLocaleLowerCase() !== "org_admin",
  );

  useEffect(() => {
    if (!enabledRoles.some((role) => role.name === newMemberRole)) {
      setNewMemberRole(enabledRoles[0]?.name ?? "");
    }
  }, [enabledRoles, newMemberRole]);

  function addDepartment() {
    const name = newDepartment.trim();
    if (!name) {
      setNotice("Enter a department name first.");
      return;
    }
    if (config.departments.some((department) =>
      department.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    )) {
      setNotice("That department already exists.");
      return;
    }
    setConfig((current) => ({
      ...current,
      departments: [...current.departments, { name, enabled: true }],
    }));
    setNewDepartment("");
    setNotice("");
  }

  function updateDepartment(
    index: number,
    update: Partial<OrganizationConfig["departments"][number]>,
  ) {
    setConfig((current) => ({
      ...current,
      departments: current.departments.map((department, departmentIndex) =>
        departmentIndex === index ? { ...department, ...update } : department,
      ),
    }));
  }

  function updateRole(index: number, update: Partial<OrganizationConfig["roles"][number]>) {
    setConfig((current) => ({
      ...current,
      roles: current.roles.map((role, roleIndex) =>
        roleIndex === index ? { ...role, ...update } : role,
      ),
    }));
  }

  function addRole() {
    const name = newRole.trim();
    if (!name) {
      setNotice("Enter a role name first.");
      return;
    }
    if (config.roles.some((role) => role.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setNotice("That role already exists.");
      return;
    }
    setConfig((current) => ({
      ...current,
      roles: [...current.roles, { name, enabled: true, permissions: [] }],
    }));
    setNewRole("");
    setNotice("");
  }

  function saveSettings() {
    save.mutate(config, {
      onSuccess: () => setNotice("Organization settings saved."),
      onError: () => setNotice("Save failed. Check the role names and permissions."),
    });
  }

  if (organizations.isLoading) return <main className="p-8">Loading organizations…</main>;
  if (organizations.isError) return <main className="p-8">Could not load organization memberships.</main>;
  if (!orgId) return <main className="p-8">No Organization Admin membership found.</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8">
      <PortalHeader title="Organization Admin" subtitle="Company administration" email={currentUser?.email} accent="violet" />
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-700">MultiOps · Organization Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Company administration</h1>
        <p className="mt-2 text-slate-600">Configure departments, roles, permissions, and organization access.</p>
      </header>

      <label className="block text-sm font-medium">Organization
        <select value={orgId} onChange={(event) => setOrgId(event.target.value)} className="mt-1 block w-full rounded-lg border p-3">
          {organizations.data?.filter((item) => item.role === "org_admin").map((item) => (
            <option key={item.organization.id} value={item.organization.id}>{item.organization.name}</option>
          ))}
        </select>
      </label>

      {settings.isLoading ? <p>Loading organization settings…</p> : settings.isError ? (
        <p className="text-red-700">Could not load organization settings.</p>
      ) : (
        <>
          <section className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border bg-white p-5 text-sm shadow-sm">
              <h2 className="font-semibold">Departments</h2>
              <form className="mt-3 flex gap-2" onSubmit={(event) => {
                event.preventDefault();
                addDepartment();
              }}>
                <input
                  value={newDepartment}
                  onChange={(event) => setNewDepartment(event.target.value)}
                  placeholder="Department name"
                  className="min-w-0 flex-1 rounded-lg border p-2"
                />
                <button type="submit" className="rounded-lg bg-violet-700 px-4 py-2 font-semibold text-white">
                  Add
                </button>
              </form>
              <div className="mt-4 space-y-2">
                {config.departments.map((department, index) => (
                  <div key={`${department.name}-${index}`} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                    <input
                      aria-label="Department name"
                      value={department.name}
                      onChange={(event) => updateDepartment(index, { name: event.target.value })}
                      className="min-w-0 flex-1 rounded-lg border p-2"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={department.enabled !== false}
                        onChange={(event) => updateDepartment(index, { enabled: event.target.checked })}
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      onClick={() => setConfig((current) => ({
                        ...current,
                        departments: current.departments.filter((_, departmentIndex) => departmentIndex !== index),
                      }))}
                      className="rounded-lg border px-3 py-2 text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {config.departments.length === 0 && (
                  <p className="text-slate-500">No departments configured yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Create a role</h2>
              <div className="mt-3 flex gap-2">
                <input
                  value={newRole}
                  onChange={(event) => setNewRole(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRole(); } }}
                  placeholder="Role name"
                  className="min-w-0 flex-1 rounded-lg border p-2"
                />
                <button type="button" onClick={addRole} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white">
                  Add role
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {config.roles.map((role, index) => (
                  <article key={`${role.name}-${index}`} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        aria-label="Role name"
                        value={role.name}
                        onChange={(event) => updateRole(index, { name: event.target.value })}
                        className="min-w-0 flex-1 rounded-lg border p-2"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={role.enabled !== false}
                          onChange={(event) => updateRole(index, { enabled: event.target.checked })} />
                        Enabled
                      </label>
                      {role.name.toLocaleLowerCase() !== "org_admin" && (
                        <button type="button" onClick={() => setConfig((current) => ({
                          ...current,
                          roles: current.roles.filter((_, roleIndex) => roleIndex !== index),
                        }))} className="rounded-lg border px-3 py-2 text-sm text-red-700">
                          Remove
                        </button>
                      )}
                    </div>
                    <RolePermissionEditor
                      permissions={role.permissions ?? []}
                      onChange={(permissions) => updateRole(index, { permissions })}
                    />
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <label className="block font-semibold">Ticket priorities · one per line
                <textarea rows={5} value={config.priorities.join("\n")}
                  onChange={(event) => setConfig((current) => ({
                    ...current,
                    priorities: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean),
                  }))}
                  className="mt-3 block w-full rounded-lg border p-3 font-normal" />
                <span className="mt-2 block text-xs font-normal text-slate-500">Keep “normal”; it is the default for new tickets.</span>
              </label>
            </section>

            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Feature availability</h2>
              {["projects", "attendance", "planner", "documents", "posts", "ai_assistant"].map((feature) => (
                <label key={feature} className="mt-3 flex justify-between text-sm capitalize">
                  {feature.replace("_", " ")}
                  <input type="checkbox" checked={Boolean(config.features[feature])}
                    onChange={(event) => setConfig((current) => ({
                      ...current, features: { ...current.features, [feature]: event.target.checked },
                    }))} />
                </label>
              ))}
            </section>

            <section className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
              <label className="block text-sm">Inbox retention in days
                <input type="number" min="1" max="3650" value={config.inbox_retention_days}
                  onChange={(event) => setConfig({ ...config, inbox_retention_days: Number(event.target.value) })}
                  className="mt-1 block w-full rounded-lg border p-2" />
              </label>
              <label className="block text-sm">Payslip and invoice availability after salary date · local preview
                <input type="number" min="1" max="365" key={orgId} defaultValue={window.localStorage.getItem(`multiops.salarySlipRetentionDays.${orgId}`) ?? "5"}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 1 && value <= 365) {
                      window.localStorage.setItem(`multiops.salarySlipRetentionDays.${orgId}`, String(value));
                    }
                  }}
                  className="mt-1 block w-full rounded-lg border p-2" />
                <span className="mt-1 block text-xs text-slate-500">Preview only; this value is not saved to the organization yet.</span>
              </label>
              <label className="block text-sm">Audit retention in years
                <input type="number" min="1" max="50" value={config.audit_retention_years}
                  onChange={(event) => setConfig({ ...config, audit_retention_years: Number(event.target.value) })}
                  className="mt-1 block w-full rounded-lg border p-2" />
              </label>
              <label className="block text-sm">Company employee ID prefix
                <input value={config.company_prefix}
                  maxLength={12}
                  pattern="[A-Za-z0-9]{2,12}"
                  onChange={(event) => setConfig({ ...config, company_prefix: event.target.value })}
                  className="mt-1 block w-full rounded-lg border p-2" />
                <span className="mt-1 block text-xs font-normal text-slate-500">Use 2–12 letters or numbers, for example MTO.</span>
              </label>
              <label className="block text-sm">Employee ID format
                <input value={config.employee_id_format}
                  onChange={(event) => setConfig({ ...config, employee_id_format: event.target.value })}
                  className="mt-1 block w-full rounded-lg border p-2" />
              </label>
            </section>
          </section>

          <div className="flex items-center gap-3">
            <button type="button" disabled={save.isPending} onClick={saveSettings}
              className="rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white disabled:opacity-50">
              {save.isPending ? "Saving…" : "Save settings"}
            </button>
            <span role="status" className="text-sm text-slate-600">{notice}</span>
          </div>
        </>
      )}

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Organization members</h2>
        <p className="mt-1 text-sm text-slate-500">Add an existing provisioned account and assign an enabled organization role.</p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => {
          event.preventDefault();
          addMember.mutate({ user_id: userId, role: newMemberRole }, {
            onSuccess: () => { setUserId(""); setNotice("Member added."); },
            onError: () => setNotice("Member could not be added. Confirm the user ID and enabled role."),
          });
        }}>
          <input required value={userId} onChange={(event) => setUserId(event.target.value)}
            placeholder="Provisioned user ID" className="min-w-0 flex-1 rounded-lg border p-3" />
          <select required value={newMemberRole} onChange={(event) => setNewMemberRole(event.target.value)}
            className="rounded-lg border p-3" disabled={enabledRoles.length === 0}>
            {enabledRoles.length === 0 ? <option value="">Create an enabled role first</option> :
              enabledRoles.map((role) => <option key={role.name} value={role.name}>{role.name}</option>)}
          </select>
          <button disabled={addMember.isPending || enabledRoles.length === 0}
            className="rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-50">
            {addMember.isPending ? "Adding…" : "Add member"}
          </button>
        </form>
        {members.isLoading ? <p className="mt-4 text-sm">Loading members…</p> :
          members.isError ? <p className="mt-4 text-sm text-red-600">Could not load members.</p> :
          <div className="mt-4 divide-y">{members.data?.map((member) => (
            <article key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{member.full_name || member.email}</p>
                <p className="text-sm text-slate-500">{member.email} · {member.role}</p>
              </div>
              {member.role.toLocaleLowerCase() !== "org_admin" && (
                <div className="flex items-center gap-2">
                  <select value={member.role} disabled={updateMember.isPending}
                    aria-label={`Role for ${member.email}`}
                    onChange={(event) => updateMember.mutate({ id: member.id, role: event.target.value })}
                    className="rounded-lg border px-3 py-2 text-sm">
                    {config.roles.filter((role) => role.enabled !== false).map((role) =>
                      <option key={role.name} value={role.name}>{role.name}</option>)}
                  </select>
                  <button type="button" onClick={() => updateMember.mutate({ id: member.id, is_active: !member.is_active })}
                    className="rounded-lg border px-3 py-2 text-sm">
                    {member.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              )}
            </article>
          ))}</div>}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Recent admin activity</h2>
        {audit.isLoading ? <p className="mt-3 text-sm">Loading activity…</p> :
          audit.isError ? <p className="mt-3 text-sm">Activity is unavailable.</p> :
          <div className="mt-3 divide-y">{audit.data?.map((item) => (
            <article key={item.id} className="py-3">
              <p className="font-medium">{item.action}</p>
              <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()} · {item.actor_user_id ?? "System"}</p>
            </article>
          ))}</div>}
      </section>
    </main>
  );
}







