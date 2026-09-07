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
import { useUpdateUser, type User } from "@/hooks/use-users";
import { ApiError } from "@/lib/api";
import { RoleCheckboxes } from "./role-checkboxes";
import { WarehouseCheckboxes } from "./warehouse-checkboxes";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function EditUserDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [warehouseIds, setWarehouseIds] = useState<string[]>([]);
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
        isActive: user.isActive,
      });
      setRoleIds(user.userRoles.map((ur) => ur.role.id));
      setWarehouseIds(user.userWarehouses.map((uw) => uw.warehouse.id));
    }
  }, [user, reset]);

  async function onSubmit(values: FormValues) {
    if (!user) return;
    try {
      await updateUser.mutateAsync({ id: user.id, ...values, roleIds, warehouseIds });
      toast.success("User updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update user");
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        {user && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-firstName">First name</Label>
                <Input id="edit-firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-lastName">Last name</Label>
                <Input id="edit-lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" {...register("phone")} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-isActive"
                type="checkbox"
                className="size-4 rounded border-input"
                checked={watch("isActive")}
                onChange={(e) => setValue("isActive", e.target.checked)}
              />
              <Label htmlFor="edit-isActive" className="font-normal">
                Active (deactivated users cannot sign in)
              </Label>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Roles</Label>
              <RoleCheckboxes value={roleIds} onChange={setRoleIds} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Warehouse access</Label>
              <WarehouseCheckboxes value={warehouseIds} onChange={setWarehouseIds} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
