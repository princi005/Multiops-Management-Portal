import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Trash2, UserRound } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useDirectory } from "../../hooks/useDirectory";
import { useMyProfile } from "../../hooks/useMe";
import { useDeletedProjects, useProjects } from "../../hooks/useProjects";
import type { Project } from "../../types/project";
import ProjectDetailPanel from "./ProjectDetailPanel";
import ProjectBinPanel from "./ProjectBinPanel";
import ProjectFormDialog from "./ProjectFormDialog";
import "./ManagerPortalPage.css";

function projectStatusLabel(status: Project["status"]) {
  return status.replace(/_/g, " ");
}

export default function ManagerPortalPage() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const projects = useProjects();
  const directory = useDirectory();
  const deletedProjects = useDeletedProjects();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [showBin, setShowBin] = useState(false);

  const list = projects.data ?? [];
  const activeCount = list.filter((project) => project.status === "active").length;
  const completedCount = list.filter((project) => project.status === "completed").length;
  const teamSize = new Set(list.flatMap((project) => [
    project.manager_id,
    ...project.members.map((member) => member.employee_id),
  ])).size;

  const visibleProjects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const statusMatches = (project: Project) => projectStatusFilter === "all" || project.status === projectStatusFilter;
    if (!term) return list.filter(statusMatches);
    return list.filter((project) => statusMatches(project) && (
      project.name.toLocaleLowerCase().includes(term) ||
      (project.description ?? "").toLocaleLowerCase().includes(term) ||
      (project.technology ?? "").toLocaleLowerCase().includes(term)),
    );
  }, [list, search, projectStatusFilter]);

  const active = visibleProjects.find((project) => project.id === selectedId) ?? visibleProjects[0] ?? null;
  const isOwner = Boolean(active && profile && active.manager_id === profile.employee_id);
  const binCount = deletedProjects.data?.length ?? 0;

  return (
    <div className="manager-workspace">
      <PortalHeader
        title="Manager Portal"
        subtitle="Projects & Tickets"
        email={user?.email}
        accent="violet"
      />

      <main className="manager-workspace__content">
        <header className="manager-workspace__heading">
          <div>
            <p className="manager-workspace__eyebrow">MultiOps Workspace</p>
            <h1 className="manager-workspace__title">{showBin ? "Project recycle bin" : "Project overview"}</h1>
            <p className="manager-workspace__subtitle">
              Plan projects, coordinate your team, and track ticket progress.
            </p>
          </div>

          <div className="manager-workspace__actions">
            <Link to="/my-profile" className="manager-workspace__button">
              <UserRound className="h-4 w-4" /> My profile
            </Link>
            <button
              type="button"
              onClick={() => setShowBin((value) => !value)}
              aria-pressed={showBin}
              className="manager-workspace__button"
            >
              <Trash2 className="h-4 w-4" />
              {showBin ? "Back to projects" : `Recycle bin${binCount ? ` (${binCount})` : ""}`}
            </button>
            {!showBin && (
              <button type="button" onClick={() => setCreating(true)} className="manager-workspace__button manager-workspace__button--primary">
                <Plus className="h-4 w-4" /> New project
              </button>
            )}
          </div>
        </header>

        {!showBin && (
          <section className="manager-workspace__stats" aria-label="Project summary">
            <article className="manager-workspace__stat">
              <span className="manager-workspace__stat-label">Projects</span>
              <strong className="manager-workspace__stat-value">{list.length}</strong>
            </article>
            <article className="manager-workspace__stat">
              <span className="manager-workspace__stat-label">Active projects</span>
              <strong className="manager-workspace__stat-value">{activeCount}</strong>
            </article>
            <article className="manager-workspace__stat">
              <span className="manager-workspace__stat-label">Team members</span>
              <strong className="manager-workspace__stat-value">{teamSize}</strong>
            </article>
          </section>
        )}

        {showBin ? (
          <ProjectBinPanel />
        ) : projects.isLoading ? (
          <LoadingState label="Loading projects…" />
        ) : projects.isError ? (
          <ErrorState message="Could not load projects." onRetry={() => projects.refetch()} />
        ) : list.length === 0 ? (
          <section className="manager-workspace__panel">
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project, then add team members and tickets."
            />
          </section>
        ) : (
          <div className="manager-workspace__layout">
            <aside className="manager-workspace__panel" aria-label="Project list">
              <div className="manager-workspace__panel-heading">
                <h2>Projects</h2>
                <span className="manager-workspace__count">{visibleProjects.length}</span>
              </div>
              <label className="sr-only" htmlFor="manager-project-search">Search projects</label>
              <input
                id="manager-project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects…"
              <label className="mt-3 block text-xs font-semibold">
                <span className="sr-only">Filter projects by status</span>
                <select value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value)} className="manager-workspace__search">
                  <option value="all">All project statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
                className="manager-workspace__search"
              />

              {visibleProjects.length === 0 ? (
                <p className="manager-workspace__empty">No projects match that search.</p>
              ) : (
                <div className="manager-workspace__project-list">
                  {visibleProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      aria-current={active?.id === project.id}
                      onClick={() => setSelectedId(project.id)}
                      className="manager-workspace__project"
                    >
                      <span className="manager-workspace__project-name">{project.name}</span>
                      <span className="manager-workspace__project-meta">
                        <span className="manager-workspace__status">{projectStatusLabel(project.status)}</span>
                        <span>{project.members.length + 1} people</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="manager-workspace__detail" aria-label="Selected project">
              {active ? (
                <ProjectDetailPanel
                  key={active.id}
                  project={active}
                  isOwner={isOwner}
                  directory={directory.data ?? []}
                  onDeleted={() => {
                    setSelectedId(null);
                    setShowBin(true);
                  }}
                />
              ) : (
                <p className="manager-workspace__empty">Choose a project to see its details.</p>
              )}
            </section>
          </div>
        )}
      </main>

      {creating && (
        <ProjectFormDialog
          onClose={() => setCreating(false)}
          onSaved={(project) => {
            setSelectedId(project.id);
            setSearch("");
          }}
        />
      )}
    </div>
  );
}
