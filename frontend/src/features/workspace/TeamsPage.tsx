import { useMemo, useState } from "react";
import { Building2, Search, Users } from "lucide-react";
import PortalHeader from "../../components/PortalHeader";
import { useActiveOrganization } from "../../hooks/useActiveOrganizationInfo";

type TeamMember = {
  name: string;
  title: string;
  department: string;
  manager: string;
};

const SAMPLE_MEMBERS: TeamMember[] = [
  { name: "Aarav Sharma", title: "Engineering Manager", department: "Development", manager: "Priya Nair" },
  { name: "Priya Nair", title: "Engineering Manager", department: "Development", manager: "Executive Office" },
  { name: "Maya Patel", title: "Team Lead", department: "Development", manager: "Aarav Sharma" },
  { name: "Kabir Rao", title: "Software Engineer", department: "Development", manager: "Maya Patel" },
  { name: "Anaya Mehta", title: "HR Manager", department: "HR", manager: "Executive Office" },
  { name: "Ishaan Gupta", title: "HR Executive", department: "HR", manager: "Anaya Mehta" },
  { name: "Sara Khan", title: "Accounts Manager", department: "Accounts", manager: "Executive Office" },
  { name: "Dev Shah", title: "Marketing Executive", department: "Marketing", manager: "Executive Office" },
];

export default function TeamsPage() {
  const organization = useActiveOrganization();
  const [department, setDepartment] = useState("All departments");
  const [search, setSearch] = useState("");

  const departments = useMemo(
    () => ["All departments", ...new Set(SAMPLE_MEMBERS.map((member) => member.department))],
    [],
  );

  const visibleMembers = SAMPLE_MEMBERS.filter((member) => {
    const matchesDepartment = department === "All departments" || member.department === department;
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || `${member.name} ${member.title} ${member.department} ${member.manager}`.toLowerCase().includes(needle);
    return matchesDepartment && matchesSearch;
  });

  const departmentCount = new Set(SAMPLE_MEMBERS.map((member) => member.department)).size;

  return (
    <div className="min-h-screen">
      <PortalHeader title="Teams" subtitle="Department directory" accent="violet" />
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <section className="rounded-3xl border p-6 sm:p-8"
          style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)", boxShadow: "var(--mo-shadow)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-800">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700">
            {organization.data?.organization.name ?? "Company"}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Teams & reporting lines</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Browse departments, managers, team leads, and team members.
          </p>
          <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-card)" }}>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Sample reporting hierarchy</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-lg bg-violet-100 px-3 py-2 font-semibold">Executive Office</span>
              <span aria-hidden="true" className="text-slate-400">→</span>
              <span className="rounded-lg bg-cyan-100 px-3 py-2 font-semibold">Managers</span>
              <span aria-hidden="true" className="text-slate-400">→</span>
              <span className="rounded-lg bg-slate-100 px-3 py-2 font-semibold">Team leads & members</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Illustrative only; the directory below uses sample reporting lines.</p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <p className="text-sm text-slate-500">Departments in this preview</p>
            <p className="mt-2 text-3xl font-extrabold">{departmentCount}</p>
          </article>
          <article className="rounded-2xl border p-5" style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
            <p className="text-sm text-slate-500">Listed team members</p>
            <p className="mt-2 text-3xl font-extrabold">{SAMPLE_MEMBERS.length}</p>
          </article>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search teams and members</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people, roles, departments..."
              className="w-full rounded-xl border bg-white py-3 pl-10 pr-3 text-sm text-slate-900"
              style={{ borderColor: "var(--mo-border)" }} />
          </label>
          <label>
            <span className="sr-only">Filter by department</span>
            <select value={department} onChange={(event) => setDepartment(event.target.value)}
              className="w-full rounded-xl border bg-white px-3 py-3 text-sm text-slate-900 sm:w-auto"
              style={{ borderColor: "var(--mo-border)" }}>
              {departments.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMembers.map((member) => (
            <article key={`${member.name}-${member.department}`} className="rounded-2xl border p-5 shadow-sm"
              style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)" }}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{member.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{member.title}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2 border-t pt-4 text-sm" style={{ borderColor: "var(--mo-border)" }}>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Department</dt><dd className="font-medium">{member.department}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Reports to</dt><dd className="text-right font-medium">{member.manager}</dd></div>
              </dl>
            </article>
          ))}
          {visibleMembers.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-sm text-slate-500" style={{ borderColor: "var(--mo-border)" }}>
              No team members match your search.
            </p>
          )}
        </section>

        <p className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          Frontend preview · directory entries are sample data. Department membership and reporting lines will use organization data in a later workflow phase.
        </p>
      </main>
    </div>
  );
}
