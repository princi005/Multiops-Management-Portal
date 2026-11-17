import { Link } from "react-router-dom";
import PortalHeader from "../../components/PortalHeader";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function WorkspaceChooserPage() {
  const { data: user, isLoading } = useCurrentUser();
  const canAccessAccounts = user?.roles.includes("Accounts") ?? false;

  return (
    <div className="min-h-screen bg-slate-50">
      <PortalHeader
        title="My Workspace"
        subtitle="Available workspaces"
        email={user?.email}
        accent="violet"
      />

      <main className="mx-auto max-w-4xl space-y-4 p-8">
        {isLoading && <p className="text-sm text-slate-500">Checking your access...</p>}

        {!isLoading && canAccessAccounts && (
          <Link
            to="/workspace/accounts"
            className="block rounded-xl border border-slate-200 bg-white p-5 font-medium text-slate-900 hover:border-violet-300"
          >
            Accounts Workspace
            <p className="mt-1 text-sm font-normal text-slate-500">
              Open the Accounts portal available to your account.
            </p>
          </Link>
        )}

        {!isLoading && !canAccessAccounts && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No workspaces are assigned to this account.
          </div>
        )}
      </main>
    </div>
  );
}
