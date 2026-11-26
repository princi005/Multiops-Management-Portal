import { useState } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useMyProfile } from "../../hooks/useMe";
import PortalHeader from "../../components/PortalHeader";
import EmployeeProjectsSection from "./EmployeeProjectsSection";
import PlannerPreviewPage from "../workspace/PlannerPreviewPage";

type TicketsView = "tickets" | "planner";

export default function EmployeeProjectsPage() {
  const { data: user } = useCurrentUser();
  const profile = useMyProfile();
  const isManager = user?.roles.includes("Manager") ?? false;
  const [view, setView] = useState<TicketsView>("tickets");

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader title="My Tickets" subtitle="Tickets, projects & planner" accent="sky" />
      <main className="mx-auto max-w-7xl space-y-5 p-5 sm:p-8">
        <div role="tablist" aria-label="My Tickets sections" className="flex gap-2">
          <button type="button" role="tab" aria-selected={view === "tickets"}
            onClick={() => setView("tickets")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === "tickets" ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 bg-white text-slate-700"}`}>
            Tickets & projects
          </button>
          <button type="button" role="tab" aria-selected={view === "planner"}
            onClick={() => setView("planner")}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${view === "planner" ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 bg-white text-slate-700"}`}>
            Planner
          </button>
        </div>

        {view === "tickets" ? (
          <>
            {profile.isLoading && <p className="text-sm text-slate-500">Loading your profile...</p>}
            {profile.isError && <p className="text-sm text-red-600">Could not load your employee profile.</p>}
            {profile.data && (
              <EmployeeProjectsSection
                employeeId={profile.data.employee_id}
                onlyAssignedProjects={isManager}
              />
            )}
          </>
        ) : (
          <PlannerPreviewPage embedded />
        )}
      </main>
    </div>
  );
}
