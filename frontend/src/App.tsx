import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import { supabase } from "./lib/supabaseClient";
import { useAuthStore } from "./store/authStore";
import { useCurrentUser } from "./hooks/useCurrentUser";

import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/auth/DashboardPage";
import WorkspaceChooserPage from "./features/auth/WorkspaceChooserPage";
import RoleWorkspacePage from "./features/auth/RoleWorkspacePage";
import EmployeeListPage from "./features/hr/EmployeeListPage";
import CeoDashboardPage from "./features/ceo/CeoDashboardPage";
import AccountsPortalPage from "./features/accounts/AccountsPortalPage";
import EmployeePortalPage from "./features/employee/EmployeePortalPage";
import EmployeeProjectsPage from "./features/employee/EmployeeProjectsPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function HomeRouter() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-600">Loading...</div>;
  }

  const roles = user?.roles ?? [];
  const hasKnownPortal = ["CEO", "Accounts", "HR", "Manager", "Employee"].some((role) =>
    roles.includes(role),
  );

  // All portal roles land on their own profile first.
  if (hasKnownPortal) return <EmployeePortalPage />;

  return <DashboardPage />;
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
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-profile"
        element={
          <ProtectedRoute>
            <EmployeePortalPage />
          </ProtectedRoute>
        }
      />

      {/* Kept for Employee, Manager, and Accounts; hidden for HR and CEO in the menu. */}
      <Route
        path="/my-projects"
        element={
          <ProtectedRoute>
            <EmployeeProjectsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <WorkspaceChooserPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workspace/:workspace"
        element={
          <ProtectedRoute>
            <RoleWorkspacePage />
          </ProtectedRoute>
        }
      />

      {/* Retain direct HR onboarding route for existing navigation. */}
      <Route
        path="/hr"
        element={
          <ProtectedRoute>
            <EmployeeListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ceo"
        element={
          <ProtectedRoute>
            <CeoDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/accounts"
        element={
          <ProtectedRoute>
            <AccountsPortalPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
