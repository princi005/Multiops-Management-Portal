import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import { useAuthStore } from "./store/authStore";
import { useCurrentUser } from "./hooks/useCurrentUser";
import LoginPage from "./features/auth/LoginPage";
import DashboardPage from "./features/auth/DashboardPage";
import EmployeeListPage from "./features/hr/EmployeeListPage";
import CeoDashboardPage from "./features/ceo/CeoDashboardPage";
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

  if (user?.roles.includes("HR")) {
    return <EmployeeListPage />;
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
    </Routes>
  );
}

export default App;