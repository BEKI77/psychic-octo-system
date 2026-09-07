"use client";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-roles";

export function PermissionCheckboxes({
  value,
  onChange,
}: {
  value: string[];
  onChange: (permissionIds: string[]) => void;
}) {
  const { data: permissions, isLoading } = usePermissions();

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...value, id] : value.filter((p) => p !== id));
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-3">
      {permissions?.map((permission) => (
        <div key={permission.id} className="flex items-center gap-2">
          <input
            id={`perm-${permission.id}`}
            type="checkbox"
            className="size-4 rounded border-input"
            checked={value.includes(permission.id)}
            onChange={(e) => toggle(permission.id, e.target.checked)}
          />
          <Label htmlFor={`perm-${permission.id}`} className="font-mono text-xs font-normal">
            {permission.code}
          </Label>
        </div>
      ))}
    </div>
  );
}
