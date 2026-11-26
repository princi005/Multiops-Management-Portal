import { LifeBuoy, MessageSquareText, ShieldCheck } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { Link } from "react-router-dom";
import IssuesSection from "../employee/IssuesSection";

export default function HelpdeskPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen">
      <PortalHeader
        title="Helpdesk"
        subtitle="Support & issue history"
        email={user?.email}
        accent="violet"
      />

      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <section
          className="rounded-[24px] border p-6 sm:p-8"
          style={{
            backgroundColor: "var(--mo-surface)",
            borderColor: "var(--mo-border)",
            boxShadow: "var(--mo-shadow-board)",
          }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">
            <LifeBuoy className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
            Employee support
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">How can we help?</h2>
          <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
            Raise a detailed issue and follow its status, replies, and history here.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article
            className="rounded-2xl border p-5"
            style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
          >
            <MessageSquareText className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            <h3 className="mt-3 font-bold">Issue details and history</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Your submitted issues, current status, and replies appear in the list below.
            </p>
          </article>

          <article
            className="rounded-2xl border p-5"
            style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
          >
            <ShieldCheck className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            <h3 className="mt-3 font-bold">Asset support</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Use My Profile → My Assets to draft a device repair, replacement, or issue request.
            </p>
            <Link to="/my-profile" className="mt-4 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50" style={{ borderColor: "var(--mo-border)" }}>
              Open My Assets
            </Link>
          </article>
        </section>

        <section
          className="rounded-[24px] border p-5 sm:p-7"
          style={{
            backgroundColor: "var(--mo-surface)",
            borderColor: "var(--mo-border)",
            boxShadow: "var(--mo-shadow)",
          }}
        >
          <IssuesSection />
        </section>
      </main>
    </div>
  );
}
