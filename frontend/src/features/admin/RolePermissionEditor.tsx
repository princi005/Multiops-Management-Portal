import { ORGANIZATION_PERMISSION_OPTIONS } from "./organizationPermissions";

export default function RolePermissionEditor({
  permissions,
  onChange,
}: {
  permissions: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
      <legend className="text-sm font-semibold">Role permissions</legend>
      {ORGANIZATION_PERMISSION_OPTIONS.map((permission) => (
        <label key={permission} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={permissions.includes(permission)}
            onChange={(event) => onChange(
              event.target.checked
                ? [...permissions, permission]
                : permissions.filter((value) => value !== permission),
            )}
          />
          {permission}
        </label>
      ))}
    </fieldset>
  );
}
