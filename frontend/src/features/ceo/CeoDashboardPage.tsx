import { Users, UserCheck, Building2 } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useCeoDashboard } from "../../hooks/useCeoDashboard";
import PortalHeader from "../../components/PortalHeader";
import StatCard from "../../components/StatCard";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

export default function CeoDashboardPage() {
  const { data: user } = useCurrentUser();
  const { data: summary, isLoading, isError, refetch } = useCeoDashboard();

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader title="CEO Portal" subtitle="Executive Overview" email={user?.email} />

      <main className="p-8 max-w-5xl mx-auto">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Company Overview</h2>

        {isLoading && <LoadingState label="Loading dashboard..." />}
        {isError && (
          <ErrorState message="Failed to load dashboard." onRetry={() => refetch()} />
        )}

        {summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Total Employees"
                value={summary.total_employees}
                icon={Users}
                color="indigo"
              />
              <StatCard
                label="Active Employees"
                value={summary.active_employees}
                icon={UserCheck}
                color="emerald"
              />
              <StatCard
                label="Departments"
                value={summary.total_departments}
                icon={Building2}
                color="amber"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Headcount by Department
                </h3>
                <ul className="space-y-1">
                  {summary.department_breakdown.map((d) => (
                    <li
                      key={d.department_name}
                      className="flex flex-row justify-between items-center text-sm border-b border-slate-100 last:border-0 py-2.5 w-full"
                    >
                      <span className="text-slate-600">{d.department_name}</span>
                      <span className="font-semibold text-slate-900 ml-4">
                        {d.employee_count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Employment Status
                </h3>
                <ul className="space-y-1">
                  {summary.status_breakdown.map((s) => (
                    <li
                      key={s.status}
                      className="flex flex-row justify-between items-center text-sm border-b border-slate-100 last:border-0 py-2.5 w-full"
                    >
                      <span className="text-slate-600 capitalize">{s.status}</span>
                      <span className="font-semibold text-slate-900 ml-4">{s.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}