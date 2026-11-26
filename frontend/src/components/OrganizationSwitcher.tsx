import { useEffect } from "react";
import { ChevronDown, Layers3 } from "lucide-react";
import { getActiveOrganizationId } from "../lib/activeOrganization";
import { useMyOrganizations, useSelectOrganization } from "../hooks/useActiveOrganization";

export default function OrganizationSwitcher() {
  const organizations = useMyOrganizations();
  const selectOrganization = useSelectOrganization();
  const items = organizations.data ?? [];
  const selectedId = getActiveOrganizationId();

  useEffect(() => {
    if (!selectedId && items.length === 1) {
      selectOrganization.mutate(items[0].organization.id);
    }
  }, [selectedId, items, selectOrganization]);

  if (organizations.isLoading || items.length === 0) return null;

  return (
    <label
      className="flex max-w-52 items-center gap-2 rounded-xl border px-2.5 py-2 text-sm text-slate-600 dark:text-slate-300"
      style={{ borderColor: "var(--mo-border)", backgroundColor: "var(--mo-card)" }}
    >
      <Layers3 className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300" aria-hidden="true" />
      <span className="sr-only">Active organization</span>
      <select
        aria-label="Active organization"
        value={selectedId ?? ""}
        onChange={(event) => selectOrganization.mutate(event.target.value)}
        disabled={selectOrganization.isPending}
        className="min-w-0 flex-1 cursor-pointer truncate bg-transparent outline-none disabled:opacity-60"
      >
        <option value="" disabled>Select organization</option>
        {items.map(({ organization }) => (
          <option key={organization.id} value={organization.id}>{organization.name}</option>
        ))}
      </select>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
    </label>
  );
}
