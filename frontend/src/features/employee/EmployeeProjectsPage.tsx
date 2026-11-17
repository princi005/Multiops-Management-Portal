import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useMyProfile } from "../../hooks/useMe";
import PortalHeader from "../../components/PortalHeader";
import EmployeeProjectsSection from "./EmployeeProjectsSection";

export default function EmployeeProjectsPage() {
  const { data: user } = useCurrentUser();
  const profile = useMyProfile();
  const isManager = user?.roles.includes("Manager") ?? false;

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        title="My Projects"
        subtitle="Projects & assigned work"
        email={user?.email}
        accent="sky"
      />
      <main className="mx-auto max-w-5xl p-8">
        {profile.isLoading && <p className="text-sm text-slate-500">Loading your profile...</p>}
        {profile.isError && <p className="text-sm text-red-600">Could not load your employee profile.</p>}
        {profile.data && (
          <EmployeeProjectsSection
            employeeId={profile.data.employee_id}
            onlyAssignedProjects={isManager}
          />
        )}
      </main>
    </div>
  );
}
