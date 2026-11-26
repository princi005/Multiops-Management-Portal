import { CalendarDays, FileText, HeartHandshake, UserRoundPlus } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";

const workflows = [
  { title: "Employee onboarding", description: "Review onboarding stages, required documents, and assigned owners.", icon: UserRoundPlus, status: "Workflow preview" },
  { title: "Offboarding & archival", description: "Review exit steps, access handoff, and employee record archival.", icon: FileText, status: "Workflow preview" },
  { title: "Leave policy & requests", description: "Review leave guidance and manager-to-HR approval stages.", icon: CalendarDays, status: "Policy preview" },
  { title: "Recognition & appreciation", description: "Review public recognition and private appreciation options.", icon: HeartHandshake, status: "Module preview" },
];

export default function HRWorkflowsPage() {
  return (
    <div className="min-h-screen">
      <PortalHeader title="HR Workflows & Policies" subtitle="HR workspace" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">People operations</p>
          <h2 className="mt-2 text-3xl font-extrabold">HR Workflows & Policies</h2>
          <p className="mt-2 text-sm text-slate-500">Onboarding, offboarding, leave guidance, and employee recognition.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {workflows.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl border p-5 shadow-sm"
                style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">{item.status}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                <button type="button" disabled className="mt-5 rounded-lg border px-4 py-2 text-sm text-slate-400"
                  style={{ borderColor: "var(--mo-border)" }}>
                  Open workflow
                </button>
              </article>
            );
          })}
        </section>
        <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          Frontend preview · workflow actions and policy records will connect in the HR workflow phase.
        </p>
      </main>
    </div>
  );
}
