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
import {
  useCreateCylinderType,
  useUpdateCylinderType,
  type CylinderType,
  type CylinderTypeInput,
} from "@/hooks/use-cylinder-types";
import { ApiError } from "@/lib/api";

// Numbers are kept as form-level strings (native number inputs already give
// strings via register()) and converted to numbers at submit time — this
// avoids z.coerce's `unknown` input type fighting react-hook-form's typed
// generic on useForm<FormValues>.
const numeric = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Number(v)), "Must be a number");

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  capacityKg: numeric("Capacity is required"),
  brand: z.string().optional(),
  description: z.string().optional(),
  depositAmount: z.string().optional(),
  defaultPrice: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function toInput(values: FormValues): CylinderTypeInput {
  return {
    ...values,
    capacityKg: Number(values.capacityKg),
    depositAmount: values.depositAmount ? Number(values.depositAmount) : undefined,
    defaultPrice: values.defaultPrice ? Number(values.defaultPrice) : undefined,
  };
}

function Fields({
  register,
  errors,
  disableCode,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  disableCode?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" disabled={disableCode} placeholder="LPG-12" {...register("code")} />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capacityKg">Capacity (kg)</Label>
          <Input id="capacityKg" type="number" step="0.01" {...register("capacityKg")} />
          {errors.capacityKg && <p className="text-sm text-destructive">{errors.capacityKg.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="12 KG LPG Cylinder" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...register("brand")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...register("description")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="depositAmount">Deposit amount</Label>
          <Input id="depositAmount" type="number" step="0.01" {...register("depositAmount")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="defaultPrice">Default price</Label>
          <Input id="defaultPrice" type="number" step="0.01" {...register("defaultPrice")} />
        </div>
      </div>
    </>
  );
}

export function CreateCylinderTypeDialog() {
  const [open, setOpen] = useState(false);
  const createType = useCreateCylinderType();
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
      await createType.mutateAsync(toInput(values));
      toast.success("Cylinder type created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create cylinder type");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New cylinder type
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New cylinder type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Fields register={register} errors={errors} />
          <DialogFooter>
            <Button type="submit" disabled={createType.isPending}>
              {createType.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditCylinderTypeDialog({
  cylinderType,
  onOpenChange,
}: {
  cylinderType: CylinderType | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateType = useUpdateCylinderType();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cylinderType) {
      reset({
        code: cylinderType.code,
        name: cylinderType.name,
        capacityKg: String(cylinderType.capacityKg),
        brand: cylinderType.brand ?? "",
        description: cylinderType.description ?? "",
        depositAmount: cylinderType.depositAmount != null ? String(cylinderType.depositAmount) : "",
        defaultPrice: cylinderType.defaultPrice != null ? String(cylinderType.defaultPrice) : "",
      });
    }
  }, [cylinderType, reset]);

  async function onSubmit(values: FormValues) {
    if (!cylinderType) return;
    try {
      const { code: _code, ...patch } = toInput(values);
      await updateType.mutateAsync({ id: cylinderType.id, ...patch });
      toast.success("Cylinder type updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update cylinder type");
    }
  }

  return (
    <Dialog open={cylinderType !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit cylinder type</DialogTitle>
        </DialogHeader>
        {cylinderType && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Fields register={register} errors={errors} disableCode />
            <DialogFooter>
              <Button type="submit" disabled={updateType.isPending}>
                {updateType.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
