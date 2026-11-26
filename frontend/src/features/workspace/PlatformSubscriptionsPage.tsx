import { useState } from "react";
import { CreditCard } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const plans = [
  { name: "Trial", description: "Evaluation access for a new client." },
  { name: "Growth", description: "Workspace access for a growing organization." },
  { name: "Enterprise", description: "Expanded plan for larger organizations." },
];

export default function PlatformSubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState("Trial");

  return (
    <div className="min-h-screen">
      <PortalHeader title="Subscriptions" subtitle="Platform Admin" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Client billing overview</p>
          <h2 className="mt-2 text-3xl font-extrabold">Subscriptions</h2>
          <p className="mt-2 text-sm text-slate-500">Review plan options and preview a client plan selection.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-2xl border p-5 shadow-sm"
              style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
              <CreditCard className="h-5 w-5 text-violet-700" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm text-slate-500">{plan.description}</p>
              <button type="button" aria-pressed={selectedPlan === plan.name}
                onClick={() => setSelectedPlan(plan.name)}
                className={`mt-4 rounded-lg border px-4 py-2 text-sm font-semibold ${selectedPlan === plan.name ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 text-slate-700"}`}>
                {selectedPlan === plan.name ? "Selected preview" : "Select preview"}
              </button>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <h3 className="font-bold">Client subscription preview</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="py-3">Organization</th><th className="py-3">Plan</th><th className="py-3">Status</th><th className="py-3">Renewal</th></tr>
              </thead>
              <tbody>
                <tr className="border-t" style={{ borderColor: "var(--mo-border)" }}>
                  <td className="py-4 font-medium">MultiOps Demo</td>
                  <td className="py-4">{selectedPlan}</td>
                  <td className="py-4">Preview</td>
                  <td className="py-4 text-slate-500">Not connected</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Plan selection is local preview state; billing and subscription updates are not connected.</p>
        </section>
      </main>
    </div>
  );
}
