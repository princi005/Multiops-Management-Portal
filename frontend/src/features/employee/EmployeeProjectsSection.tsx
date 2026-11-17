import { useQueries } from "@tanstack/react-query";
import { useUpdateTicketStatus } from "../../hooks/useTickets";
import { useProjects } from "../../hooks/useProjects";
import { apiClient } from "../../lib/apiClient";
import type { Project, Ticket, TicketStatus } from "../../types/project";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

const EMPLOYEE_STATUSES: TicketStatus[] = [
  "not_started",
  "in_progress",
  "for_review",
  "completed",
];

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

  if (projects.isLoading) return <LoadingState label="Loading your projects..." />;
  if (projects.isError) {
    return <ErrorState message="Could not load your projects." onRetry={() => projects.refetch()} />;
  }

  if (onlyAssignedProjects && ticketQueries.some((query) => query.isLoading)) {
    return <LoadingState label="Finding projects with tickets assigned to you..." />;
  }

  const visibleProjects = projectList.filter((project, index) => {
    if (!onlyAssignedProjects) return true;
    return (ticketQueries[index]?.data ?? []).some(
      (ticket) => ticket.assigned_to_id === employeeId,
    );
  });

  if (visibleProjects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {onlyAssignedProjects
          ? "No projects have tickets assigned to you yet."
          : "You have not been added to a project yet. Projects will appear here when your manager adds you."}
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">My Projects</h2>
      <div className="space-y-4">
        {visibleProjects.map((project) => {
          const projectIndex = projectList.findIndex((item) => item.id === project.id);
          const assignedTickets = (ticketQueries[projectIndex]?.data ?? []).filter(
            (ticket) => ticket.assigned_to_id === employeeId,
          );

          return (
            <ProjectCard
              key={project.id}
              project={project}
              tickets={assignedTickets}
              updatePending={updateStatus.isPending}
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

function ProjectCard({
  project,
  tickets,
  updatePending,
  onStatusChange,
}: {
  project: Project;
  tickets: Ticket[];
  updatePending: boolean;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{project.name}</h3>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium capitalize text-sky-700">
          {project.status.replace(/_/g, " ")}
        </span>
      </div>

      {project.description && <p className="mt-2 text-sm text-slate-600">{project.description}</p>}
      {project.technology && <p className="mt-2 text-xs text-slate-500">Technology: {project.technology}</p>}

      {tickets.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No tickets assigned to you in this project.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{ticket.title}</p>
                {ticket.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{ticket.description}</p>
                )}
              </div>
              <select
                aria-label={`Status for ${ticket.title}`}
                value={ticket.status}
                disabled={updatePending}
                onChange={(event) => onStatusChange(ticket.id, event.target.value as TicketStatus)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm capitalize"
              >
                {EMPLOYEE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
