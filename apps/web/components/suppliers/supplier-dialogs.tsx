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
import { useCreateSupplier, useUpdateSupplier, type Supplier } from "@/hooks/use-suppliers";
import { ApiError } from "@/lib/api";
import { SupplierFormFields, type SupplierFormValues } from "./supplier-form-fields";

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  contactPerson: z.string().optional(),
});

export function CreateSupplierDialog() {
  const [open, setOpen] = useState(false);
  const createSupplier = useCreateSupplier();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({ resolver: zodResolver(schema) });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function onSubmit(values: SupplierFormValues) {
    try {
      await createSupplier.mutateAsync(values);
      toast.success("Supplier created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create supplier");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New supplier
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <SupplierFormFields register={register} errors={errors} />
          <DialogFooter>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending ? "Creating..." : "Create supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditSupplierDialog({
  supplier,
  onOpenChange,
}: {
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateSupplier = useUpdateSupplier();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (supplier) {
      reset({
        code: supplier.code,
        name: supplier.name,
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        taxNumber: supplier.taxNumber ?? "",
        contactPerson: supplier.contactPerson ?? "",
      });
    }
  }, [supplier, reset]);

  async function onSubmit(values: SupplierFormValues) {
    if (!supplier) return;
    try {
      const { code: _code, ...patch } = values;
      await updateSupplier.mutateAsync({ id: supplier.id, ...patch });
      toast.success("Supplier updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update supplier");
    }
  }

  return (
    <Dialog open={supplier !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit supplier</DialogTitle>
        </DialogHeader>
        {supplier && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <SupplierFormFields register={register} errors={errors} disableCode />
            <DialogFooter>
              <Button type="submit" disabled={updateSupplier.isPending}>
                {updateSupplier.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
