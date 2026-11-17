
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import { supabase } from "./lib/supabaseClient";
import { useAuthStore } from "./store/authStore";
import { useCurrentUser } from "./hooks/useCurrentUser";

import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/auth/DashboardPage";
import EmployeeListPage from "./features/hr/EmployeeListPage";
import CeoDashboardPage from "./features/ceo/CeoDashboardPage";
import AccountsPortalPage from "./features/accounts/AccountsPortalPage";
import EmployeePortalPage from "./features/employee/EmployeePortalPage";

import ManagerPortalPage from "./features/manager/ManagerPortalPage";
import ManagerProfilePage from "./features/manager/ManagerProfilePage";

import ProtectedRoute from "./routes/ProtectedRoute";

function HomeRouter() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (user?.roles.includes("CEO")) {
    return <CeoDashboardPage />;
  }

  if (user?.roles.includes("Accounts")) {
    return <AccountsPortalPage />;
  }

  if (user?.roles.includes("HR")) {
    return <EmployeeListPage />;
  }

  if (user?.roles.includes("Manager")) {
    return <ManagerPortalPage />;
  }

  if (user?.roles.includes("Employee")) {
    return <EmployeePortalPage />;
  }

  return <DashboardPage />;
}

function App() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

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
            <ManagerProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
