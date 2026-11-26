import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Users } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const initialVisibility = {
  department: true,
  reportingLines: true,
  contactDetails: false,
};

export default function OrganizationPeoplePage() {
  const [visibility, setVisibility] = useState(initialVisibility);

  function toggle(key: keyof typeof initialVisibility) {
    setVisibility((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="min-h-screen">
      <PortalHeader title="Employees & Visibility" subtitle="Organization Admin" accent="violet" />
      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Organization administration</p>
          <h2 className="mt-2 text-3xl font-extrabold">Employees & Visibility</h2>
          <p className="mt-2 text-sm text-slate-500">Preview organization directory and profile visibility controls.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <Users className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <h3 className="mt-3 font-bold">Employee directory</h3>
            <p className="mt-1 text-sm text-slate-500">Manage employee records, departments, and reporting relationships.</p>
            <button type="button" disabled className="mt-4 rounded-lg border px-4 py-2 text-sm text-slate-400" style={{ borderColor: "var(--mo-border)" }}>
              Open employee management
            </button>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <ShieldCheck className="h-5 w-5 text-violet-700" aria-hidden="true" />
            <h3 className="mt-3 font-bold">Executive profile restriction</h3>
            <p className="mt-1 text-sm text-slate-500">CEO profile visibility requires an authorized, restricted access policy.</p>
            <span className="mt-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Backend enforcement pending</span>
          </article>
        </section>

        <section className="rounded-2xl border p-5" style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <h3 className="font-bold">Directory visibility preview</h3>
          <div className="mt-4 space-y-3">
            {([
              ["department", "Department"],
              ["reportingLines", "Manager and team-lead relationships"],
              ["contactDetails", "Work contact details"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 rounded-xl border p-4"
                style={{ borderColor: "var(--mo-border)" }}>
                <span className="text-sm font-medium">{label}</span>
                <span className="flex items-center gap-3">
                  {visibility[key] ? <Eye className="h-4 w-4 text-emerald-700" /> : <EyeOff className="h-4 w-4 text-slate-500" />}
                  <input type="checkbox" checked={visibility[key]} onChange={() => toggle(key)} />
                </span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">These switches are local preview state and are not saved to the organization.</p>
        </section>
      </main>
    </div>
  );
}
