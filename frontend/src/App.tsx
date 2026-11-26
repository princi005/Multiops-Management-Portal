import { lazy, Suspense, useEffect } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { useAuthStore } from "./store/authStore";
import { useCurrentUser } from "./hooks/useCurrentUser";
import ProtectedRoute from "./routes/ProtectedRoute";
import PortalSidebar from "./components/PortalSidebar";

const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const DashboardPage = lazy(() => import("./features/auth/DashboardPage"));
const WorkspaceChooserPage = lazy(() => import("./features/auth/WorkspaceChooserPage"));
const RoleWorkspacePage = lazy(() => import("./features/auth/RoleWorkspacePage"));
const EmployeeListPage = lazy(() => import("./features/hr/EmployeeListPage"));
const CeoDashboardPage = lazy(() => import("./features/ceo/CeoDashboardPage"));
const AccountsPortalPage = lazy(() => import("./features/accounts/AccountsPortalPage"));
const EmployeePortalPage = lazy(() => import("./features/employee/EmployeePortalPage"));
const EmployeeProjectsPage = lazy(() => import("./features/employee/EmployeeProjectsPage"));
const OrganizationAdminPage = lazy(() => import("./features/admin/OrganizationAdminPage"));
const SuperAdminPage = lazy(() => import("./features/admin/SuperAdminPage"));
const WorkspacePlaceholderPage = lazy(() => import("./features/workspace/WorkspacePlaceholderPage"));

function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-600" role="status">
      Loading MultiOps…
    </div>
  );
}

function HomeRouter() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <PageLoading />;
  if (user?.is_platform_admin) return <SuperAdminPage />;
  if (user?.organization_roles?.includes("org_admin")) return <OrganizationAdminPage />;
  if ((user?.roles ?? []).length) return <EmployeePortalPage />;
  return <DashboardPage />;
}

function AuthenticatedWorkspace() {
  return (
    <div className="min-h-screen md:flex">
      <PortalSidebar />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, setLoading]);

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AuthenticatedWorkspace />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRouter />} />
          <Route path="my-profile" element={<EmployeePortalPage />} />
          <Route path="my-projects" element={<EmployeeProjectsPage />} />
          <Route path="workspace" element={<WorkspaceChooserPage />} />
          <Route path="workspace/:workspace" element={<RoleWorkspacePage />} />
          <Route path="workspace/modules/:moduleId" element={<WorkspacePlaceholderPage />} />
          <Route path="hr" element={<EmployeeListPage />} />
          <Route path="ceo" element={<CeoDashboardPage />} />
          <Route path="accounts" element={<AccountsPortalPage />} />
          <Route path="admin/organization" element={<OrganizationAdminPage />} />
          <Route path="admin/platform" element={<SuperAdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
