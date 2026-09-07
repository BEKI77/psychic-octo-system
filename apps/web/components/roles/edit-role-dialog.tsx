"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateRole, type Role } from "@/hooks/use-roles";
import { ApiError } from "@/lib/api";
import { PermissionCheckboxes } from "./permission-checkboxes";

const schema = z.object({ description: z.string().optional() });
type FormValues = z.infer<typeof schema>;

export function EditRoleDialog({
  role,
  onOpenChange,
}: {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const updateRole = useUpdateRole();

  const { register, handleSubmit, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (role) {
      reset({ description: role.description ?? "" });
      setPermissionIds(role.rolePermissions.map((rp) => rp.permission.id));
    }
  }, [role, reset]);

  async function onSubmit(values: FormValues) {
    if (!role) return;
    try {
      await updateRole.mutateAsync({ id: role.id, ...values, permissionIds });
      toast.success("Role updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update role");
    }
  }

  return (
    <Dialog open={role !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit role{role ? `: ${role.name}` : ""}</DialogTitle>
        </DialogHeader>
        {role && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-role-description">Description</Label>
              <Input id="edit-role-description" {...register("description")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Permissions</Label>
              <PermissionCheckboxes value={permissionIds} onChange={setPermissionIds} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={updateRole.isPending}>
                {updateRole.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
