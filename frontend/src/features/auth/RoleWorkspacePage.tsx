import type { ComponentType } from "react";
import { Navigate, useParams } from "react-router-dom";
import LoadingState from "../../components/LoadingState";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import EmployeeProjectsPage from "../employee/EmployeeProjectsPage";
import ManagerPortalPage from "../manager/ManagerPortalPage";
import EmployeeListPage from "../hr/EmployeeListPage";
import AccountsPortalPage from "../accounts/AccountsPortalPage";
import CeoDashboardPage from "../ceo/CeoDashboardPage";

const PAGES: Record<string, { role: string; component: ComponentType }> = {
  employee: { role: "Employee", component: EmployeeProjectsPage },
  manager: { role: "Manager", component: ManagerPortalPage },
  hr: { role: "HR", component: EmployeeListPage },
  accounts: { role: "Accounts", component: AccountsPortalPage },
  ceo: { role: "CEO", component: CeoDashboardPage },
};

export default function RoleWorkspacePage() {
  const { workspace } = useParams();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <LoadingState label="Checking workspace access..." />;

  const page = workspace ? PAGES[workspace] : undefined;

  if (!page || !user?.roles.includes(page.role)) {
    return <Navigate to="/workspace" replace />;
  }

  const Workspace = page.component;
  return <Workspace />;
}
