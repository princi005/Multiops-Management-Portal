import { NavLink } from "react-router-dom";
import { getPortalLabel, getSidebarModules } from "./portalModules";
import { useActiveOrganization } from "../hooks/useActiveOrganizationInfo";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function PortalSidebar() {
  const { data: user } = useCurrentUser();
  const organization = useActiveOrganization();
  const modules = getSidebarModules(user);
  const organizationName =
    organization.data?.organization.name ??
    (user?.is_platform_admin ? "Platform Administration" : "Organization workspace");

  return (
    <aside
      className="w-full shrink-0 border-b p-4 md:sticky md:top-0 md:h-screen md:w-[276px] md:overflow-y-auto md:border-b-0 md:border-r md:p-5"
      style={{
        backgroundColor: "color-mix(in srgb, var(--mo-page) 92%, var(--mo-text) 8%)",
        borderColor: "var(--mo-border)",
        boxShadow: "var(--mo-shadow)",
        backdropFilter: "blur(22px) saturate(160%)",
      }}
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-800 via-violet-600 to-pink-500 text-lg font-extrabold text-white shadow-lg">
          M
        </span>
        <span>
          <strong className="block text-base tracking-tight">MultiOps</strong>
          <span className="text-xs text-slate-600 dark:text-slate-400">Company workspace</span>
        </span>
      </div>

      <div
        className="mb-5 rounded-2xl border p-3"
        style={{
          borderColor: "var(--mo-border)",
          backgroundColor: "var(--mo-elevated)",
          boxShadow: "var(--mo-shadow)",
        }}
      >
        <p className="truncate text-sm font-extrabold">{organizationName}</p>
        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {getPortalLabel(user)}
        </p>
        <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">
          {user?.full_name || "Signed-in account"}
        </p>
      </div>

      <nav aria-label="Workspace modules" className="space-y-1">
        <h2 className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
          My workspace
        </h2>

        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <NavLink
              key={module.id}
              to={module.href}
              end={module.href === "/"}
              title={module.description}
              style={({ isActive }) => ({
                color: isActive
                  ? "color-mix(in srgb, var(--mo-violet-soft) 75%, var(--mo-text))"
                  : "var(--mo-text-secondary)",
                backgroundColor: isActive ? "rgba(124, 58, 237, 0.16)" : "transparent",
                borderColor: isActive ? "rgba(124, 58, 237, 0.42)" : "transparent",
              })}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition hover:bg-violet-100/70 dark:hover:bg-white/5"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{module.label}</span>
              {!module.connected && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800 dark:bg-violet-400/15 dark:text-violet-200">
                  Preview
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
