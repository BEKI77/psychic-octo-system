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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCylinder } from "@/hooks/use-cylinders";
import { useCylinderTypes } from "@/hooks/use-cylinder-types";
import { useWarehouses } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const schema = z.object({
  cylinderTypeId: z.string().min(1, "Select a cylinder type"),
  internalCode: z.string().min(1),
  serialNumber: z.string().min(1),
  qrCode: z.string().optional(),
  barcode: z.string().optional(),
  currentWarehouseId: z.string().optional(),
  currentLocationId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const NONE = "__none__";

/** Base UI's Select emits `string | null` (null when cleared). */
function orUndefined(value: string | null): string | undefined {
  return value && value !== NONE ? value : undefined;
}

export function CreateCylinderDialog() {
  const [open, setOpen] = useState(false);
  const createCylinder = useCreateCylinder();
  const { data: types } = useCylinderTypes();
  const { data: warehouses } = useWarehouses();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedWarehouse = warehouses?.find((w) => w.id === watch("currentWarehouseId"));

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset({ cylinderTypeId: "", internalCode: "", serialNumber: "" });
  }

  async function onSubmit(values: FormValues) {
    try {
      await createCylinder.mutateAsync(values);
      toast.success("Cylinder registered");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to register cylinder");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Register cylinder
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register cylinder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Cylinder type</Label>
            <Select
              value={watch("cylinderTypeId")}
              onValueChange={(v) => setValue("cylinderTypeId", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {types?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cylinderTypeId && (
              <p className="text-sm text-destructive">{errors.cylinderTypeId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="internalCode">Internal code</Label>
              <Input id="internalCode" placeholder="CYL-001245" {...register("internalCode")} />
              {errors.internalCode && (
                <p className="text-sm text-destructive">{errors.internalCode.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input id="serialNumber" {...register("serialNumber")} />
              {errors.serialNumber && (
                <p className="text-sm text-destructive">{errors.serialNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qrCode">QR code</Label>
              <Input id="qrCode" {...register("qrCode")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" {...register("barcode")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Warehouse</Label>
              <Select
                value={watch("currentWarehouseId") ?? NONE}
                onValueChange={(v) => {
                  setValue("currentWarehouseId", orUndefined(v));
                  setValue("currentLocationId", undefined);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {warehouses?.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Location</Label>
              <Select
                value={watch("currentLocationId") ?? NONE}
                onValueChange={(v) => setValue("currentLocationId", orUndefined(v))}
                disabled={!selectedWarehouse}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {selectedWarehouse?.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createCylinder.isPending}>
              {createCylinder.isPending ? "Registering..." : "Register"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
