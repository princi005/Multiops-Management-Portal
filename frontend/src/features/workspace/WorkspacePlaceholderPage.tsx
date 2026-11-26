import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import { getPortalModules } from "../../components/portalModules";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import AttendancePreviewPage from "./AttendancePreviewPage";
import PlannerPreviewPage from "./PlannerPreviewPage";
import InboxPage from "./InboxPage";
import DocsPage from "./DocsPage";
import PostsPage from "./PostsPage";
import HelpdeskPage from "./HelpdeskPage";
import MyMeetingsPage from "./MyMeetingsPage";
import AppsPage from "./AppsPage";
import TeamsPage from "./TeamsPage";
import AIAssistantPage from "./AIAssistantPage";
import HRWorkflowsPage from "./HRWorkflowsPage";
import OrganizationPeoplePage from "./OrganizationPeoplePage";
import OrganizationActivityPage from "./OrganizationActivityPage";
import PlatformDomainsPage from "./PlatformDomainsPage";
import PlatformSubscriptionsPage from "./PlatformSubscriptionsPage";
import PlatformActivityPage from "./PlatformActivityPage";
import PlatformOperationsPage from "./PlatformOperationsPage";

type LeaveRequest = {
  id: string;
  employee: string;
  type: string;
  dates: string;
  submitted: string;
  status: "Pending" | "Approved" | "Declined";
};

function TeamProgressPreview() {
  const projects = [
    { name: "Internal Platform", team: "Product & Engineering", progress: 68, status: "On track" },
    { name: "Employee onboarding", team: "People Operations", progress: 42, status: "Needs attention" },
    { name: "Finance workspace", team: "Accounts", progress: 85, status: "On track" },
  ];

  return (
    <div className="min-h-screen">
      <PortalHeader title="Team Progress" subtitle="Manager workspace" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Manager overview</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Team Progress</h2>
          <p className="mt-2 text-sm text-slate-500">Project health, team workload, and upcoming delivery dates.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active projects", value: "3", icon: TrendingUp },
            { label: "Team members", value: "12", icon: Users },
            { label: "Open tickets", value: "18", icon: CheckCircle2 },
            { label: "Due this week", value: "4", icon: Clock3 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-2xl border p-5 shadow-sm"
                style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <Icon className="h-5 w-5 text-violet-700" aria-hidden="true" />
                </div>
                <p className="mt-3 text-3xl font-extrabold">{item.value}</p>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border shadow-sm"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="border-b p-5" style={{ borderColor: "var(--mo-border)" }}>
            <h3 className="font-bold">Project progress</h3>
            <p className="mt-1 text-sm text-slate-500">Sample preview values; connected analytics will come with the workflow phase.</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--mo-border)" }}>
            {projects.map((project) => (
              <article key={project.name} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h4 className="font-semibold">{project.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{project.team} · {project.status}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-violet-600" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold">{project.progress}%</span>
              </article>
            ))}
          </div>
        </section>

        <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          Frontend preview · project and team metrics are sample values and are not saved.
        </p>
      </main>
    </div>
  );
}

function LeaveRequestsPreview() {
  const [view, setView] = useState<"requests" | "history">("requests");
  const [requests, setRequests] = useState<LeaveRequest[]>([
    { id: "LR-104", employee: "Aarav Sharma", type: "Annual leave", dates: "Dec 2–4, 2026", submitted: "Nov 24, 2026", status: "Pending" },
    { id: "LR-103", employee: "Maya Patel", type: "Work from home", dates: "Nov 30, 2026", submitted: "Nov 23, 2026", status: "Pending" },
    { id: "LR-102", employee: "Kabir Rao", type: "Sick leave", dates: "Nov 20, 2026", submitted: "Nov 19, 2026", status: "Approved" },
  ]);

  const visibleRequests = requests.filter((request) =>
    view === "requests" ? request.status === "Pending" : request.status !== "Pending",
  );

  function decide(id: string, status: "Approved" | "Declined") {
    setRequests((items) => items.map((request) =>
      request.id === id ? { ...request, status } : request,
    ));
  }

  return (
    <div className="min-h-screen">
      <PortalHeader title="Leave Requests" subtitle="Manager workspace" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">Manager workspace</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Leave Requests</h2>
          <p className="mt-2 text-sm text-slate-500">Review employee leave requests and view their decision history.</p>
        </section>

        <div role="tablist" aria-label="Leave request views" className="flex gap-2">
          <button type="button" role="tab" aria-selected={view === "requests"}
            onClick={() => setView("requests")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === "requests" ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 bg-white text-slate-700"}`}>
            Leave requests
          </button>
          <button type="button" role="tab" aria-selected={view === "history"}
            onClick={() => setView("history")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === "history" ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 bg-white text-slate-700"}`}>
            History
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border shadow-sm"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
          <div className="border-b p-5" style={{ borderColor: "var(--mo-border)" }}>
            <h3 className="font-bold">{view === "requests" ? "Pending leave requests" : "Leave request history"}</h3>
            <p className="mt-1 text-sm text-slate-500">Preview actions update this page only; requests are not saved.</p>
          </div>
          {visibleRequests.length > 0 ? (
            <div className="divide-y" style={{ borderColor: "var(--mo-border)" }}>
              {visibleRequests.map((request) => (
                <article key={request.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h4 className="font-semibold">{request.employee} · {request.type}</h4>
                    <p className="mt-1 text-sm text-slate-500">{request.dates} · Submitted {request.submitted}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-600">{request.status}</p>
                  </div>
                  {view === "requests" && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(request.id, "Approved")}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                        Approve preview
                      </button>
                      <button type="button" onClick={() => decide(request.id, "Declined")}
                        className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700">
                        Decline preview
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-slate-500">
              {view === "requests" ? "There are no pending leave requests." : "No leave decisions in this preview yet."}
            </p>
          )}
        </section>

        <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          Frontend preview · leave requests and history only. Approval workflow and HR follow-up are not connected yet.
        </p>
      </main>
    </div>
  );
}
export default function WorkspacePlaceholderPage() {
  const { moduleId } = useParams();
  const { data: user } = useCurrentUser();
  const module = getPortalModules(user).find((item) => item.id === moduleId);

  if (!module) return <Navigate to="/" replace />;
  if (moduleId === "team-analytics") return <TeamProgressPreview />;
  if (moduleId === "approvals") return <LeaveRequestsPreview />;

  if (moduleId === "attendance") return <AttendancePreviewPage />;
  if (moduleId === "planner") return <PlannerPreviewPage />;
  if (moduleId === "inbox") return <InboxPage />;
  if (moduleId === "documents") return <DocsPage />;
  if (moduleId === "posts") return <PostsPage />;
  if (moduleId === "helpdesk") return <HelpdeskPage />;
  if (moduleId === "meetings") return <MyMeetingsPage />;
  if (moduleId === "apps") return <AppsPage />;
  if (moduleId === "teams") return <TeamsPage />;
  if (moduleId === "ai-assistant") return <AIAssistantPage />;
  if (moduleId === "hr-workflows") return <HRWorkflowsPage />;
  if (moduleId === "organization-people") return <OrganizationPeoplePage />;
  if (moduleId === "organization-audit") return <OrganizationActivityPage />;
  if (moduleId === "platform-domains") return <PlatformDomainsPage />;
  if (moduleId === "platform-subscriptions") return <PlatformSubscriptionsPage />;
  if (moduleId === "platform-activity") return <PlatformActivityPage />;
  if (moduleId === "platform-operations") return <PlatformOperationsPage />;

  return (
    <div className="min-h-screen">
      <PortalHeader title={module.label} subtitle={module.group} accent="violet" />
      <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
        <section className="rounded-[24px] border p-6 shadow-xl sm:p-8"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)", boxShadow: "var(--mo-shadow)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
            <module.icon className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">{module.group}</p>
          <h2 className="mt-2 text-3xl font-bold">{module.label}</h2>
          <p className="mt-3 max-w-3xl text-slate-600">{module.description}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {module.previewItems.map((item) => (
            <article key={item} className="rounded-2xl border p-5 shadow-sm"
              style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
              <CheckCircle2 className="h-5 w-5 text-violet-600" />
              <h3 className="mt-3 font-semibold">{item}</h3>
            </article>
          ))}
        </section>

        <section className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/80 p-5 text-violet-950">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Frontend preview</h3>
            <p className="mt-1 text-sm">This module’s interface is visible for review. Its data and actions will be connected to backend workflows in a later phase.</p>
          </div>
        </section>
      </main>
    </div>
  );
}




