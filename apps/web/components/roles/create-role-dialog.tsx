"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateRole } from "@/hooks/use-roles";
import { ApiError } from "@/lib/api";
import { PermissionCheckboxes } from "./permission-checkboxes";

const schema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Upper-case letters, numbers and underscores only"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const createRole = useCreateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setPermissionIds([]);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      await createRole.mutateAsync({ ...values, permissionIds });
      toast.success("Role created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create role");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New role
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. DISPATCHER" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Permissions</Label>
            <PermissionCheckboxes value={permissionIds} onChange={setPermissionIds} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending ? "Creating..." : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
