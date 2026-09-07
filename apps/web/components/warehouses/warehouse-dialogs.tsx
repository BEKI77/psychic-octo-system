"use client";

import { useEffect, useState } from "react";
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
import { useCreateWarehouse, useUpdateWarehouse, type Warehouse } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateWarehouseDialog() {
  const [open, setOpen] = useState(false);
  const createWarehouse = useCreateWarehouse();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function onSubmit(values: FormValues) {
    try {
      await createWarehouse.mutateAsync(values);
      toast.success("Warehouse created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create warehouse");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New warehouse
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New warehouse</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Code</Label>
              <Input id="code" placeholder="WH-001" {...register("code")} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Main Warehouse" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createWarehouse.isPending}>
              {createWarehouse.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditWarehouseDialog({
  warehouse,
  onOpenChange,
}: {
  warehouse: Warehouse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateWarehouse = useUpdateWarehouse();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (warehouse) {
      reset({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address ?? "",
        phone: warehouse.phone ?? "",
      });
    }
  }, [warehouse, reset]);

  async function onSubmit(values: FormValues) {
    if (!warehouse) return;
    try {
      const { code: _code, ...patch } = values;
      await updateWarehouse.mutateAsync({ id: warehouse.id, ...patch });
      toast.success("Warehouse updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update warehouse");
    }
  }

  return (
    <Dialog open={warehouse !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit warehouse</DialogTitle>
        </DialogHeader>
        {warehouse && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-code">Code</Label>
                <Input id="edit-code" disabled {...register("code")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" {...register("phone")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-address">Address</Label>
              <Input id="edit-address" {...register("address")} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateWarehouse.isPending}>
                {updateWarehouse.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
