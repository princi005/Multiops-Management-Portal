import { useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { supabase } from "../../lib/supabaseClient";
import { useAuthStore } from "../../store/authStore";

interface MeResponse {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
}

export default function DashboardPage() {
  const session = useAuthStore((s) => s.session);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<MeResponse>("/auth/me")
      .then((res) => setMe(res.data))
      .catch(() => setError("Could not load profile from backend."));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Logged in</h1>
        <p className="text-gray-600 mb-4">{session?.user.email}</p>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {me && (
          <div className="text-left text-sm bg-gray-50 rounded p-4 mb-4">
            <p><span className="font-medium">Roles:</span> {me.roles.join(", ") || "none"}</p>
            <p><span className="font-medium">Full name:</span> {me.full_name}</p>
          </div>
        )}

        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-gray-600 underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}