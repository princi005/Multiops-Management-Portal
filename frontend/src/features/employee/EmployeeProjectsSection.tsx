import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useUpdateTicketStatus } from "../../hooks/useTickets";
import { useProjects } from "../../hooks/useProjects";
import { apiClient } from "../../lib/apiClient";
import type { Project, Ticket, TicketStatus } from "../../types/project";
import { MEMBER_TICKET_STATUSES } from "../../types/project";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import TicketWorkspaceViews from "../manager/TicketWorkspaceViews";
import EmployeeTicketCreatePanel from "./EmployeeTicketCreatePanel";

export default function EmployeeProjectsSection({
  employeeId,
  onlyAssignedProjects = false,
}: {
  employeeId: string;
  onlyAssignedProjects?: boolean;
}) {
  const projects = useProjects();
  const updateStatus = useUpdateTicketStatus();
  const projectList = projects.data ?? [];

  const ticketQueries = useQueries({
    queries: projectList.map((project) => ({
      queryKey: ["tickets", project.id],
      queryFn: async () => {
        const { data } = await apiClient.get<Ticket[]>(`/projects/${project.id}/tickets`);
        return data;
      },
      enabled: Boolean(employeeId),
    })),
  });

  if (projects.isLoading) return <LoadingState label="Loading your projects…" />;
  if (projects.isError) {
    return <ErrorState message="Could not load your projects." onRetry={() => projects.refetch()} />;
  }
  if (ticketQueries.some((query) => query.isLoading)) {
    return <LoadingState label="Loading project tickets…" />;
  }

  const visibleProjects = projectList.filter((_, index) => {
    if (!onlyAssignedProjects) return true;
    return (ticketQueries[index]?.data ?? []).some(
      (ticket) => ticket.assigned_to_id === employeeId,
    );
  });

  if (visibleProjects.length === 0) {
    return (
      <div
        className="rounded-2xl border p-6 text-sm text-slate-600 dark:text-slate-300"
        style={{ backgroundColor: "var(--mo-card)", borderColor: "var(--mo-border)" }}
      >
        {onlyAssignedProjects
          ? "No projects have tickets assigned to you yet."
          : "You have not been added to a project yet. Projects will appear here when your manager adds you."}
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-extrabold text-slate-900 dark:text-white">My Tickets</h2>
      <div className="space-y-5">
        {visibleProjects.map((project) => {
          const index = projectList.findIndex((item) => item.id === project.id);
          const projectTickets = ticketQueries[index]?.data ?? [];
          const tickets = projectTickets.filter(
            (ticket) => ticket.assigned_to_id === employeeId,
          );

          return (
            <ProjectTicketCard
              key={project.id}
              project={project}
              employeeId={employeeId}
              tickets={tickets}
              onStatusChange={(ticketId, status) =>
                updateStatus.mutate({ projectId: project.id, ticketId, status })
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function ProjectTicketCard({
  project,
  employeeId,
  tickets,
  onStatusChange,
}: {
  project: Project;
  employeeId: string;
  tickets: Ticket[];
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <article
      className="space-y-4 rounded-2xl border p-5 shadow-sm sm:p-6"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{project.name}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold capitalize text-sky-800 dark:bg-sky-400/15 dark:text-sky-200">
            {project.status.replace(/_/g, " ")}
          </span>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-3.5 py-2 text-sm font-bold text-white hover:bg-violet-800"
            >
              <Plus className="h-4 w-4" />
              New ticket
            </button>
          )}
        </div>
      </header>

      {creating && (
        <EmployeeTicketCreatePanel
          projectId={project.id}
          employeeId={employeeId}
          onCreated={() => setCreating(false)}
          onCancel={() => setCreating(false)}
        />
      )}

      <TicketWorkspaceViews
        tickets={tickets}
        directory={[{ id: employeeId, full_name: "You", email: "" }]}
        editableStatuses={MEMBER_TICKET_STATUSES}
        onStatusChange={onStatusChange}
      />
    </article>
  );
}

