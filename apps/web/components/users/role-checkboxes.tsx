"use client";

import { Label } from "@/components/ui/label";
import { useRoles } from "@/hooks/use-roles";
import { Skeleton } from "@/components/ui/skeleton";

export function RoleCheckboxes({
  value,
  onChange,
}: {
  value: string[];
  onChange: (roleIds: string[]) => void;
}) {
  const { data: roles, isLoading } = useRoles();

  function toggle(roleId: string, checked: boolean) {
    onChange(checked ? [...value, roleId] : value.filter((id) => id !== roleId));
  }

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {roles?.map((role) => (
        <div key={role.id} className="flex items-start gap-2">
          <input
            id={`role-${role.id}`}
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            checked={value.includes(role.id)}
            onChange={(e) => toggle(role.id, e.target.checked)}
          />
          <Label htmlFor={`role-${role.id}`} className="flex flex-col gap-0.5 font-normal">
            <span className="font-medium">{role.name}</span>
            {role.description && (
              <span className="text-xs text-muted-foreground">{role.description}</span>
            )}
          </Label>
        </div>
      ))}
      {roles?.length === 0 && <p className="text-sm text-muted-foreground">No roles yet.</p>}
    </div>
  );
}
