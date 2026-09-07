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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AVAILABILITY_STATUSES,
  CONDITION_STATUSES,
  useUpdateCylinder,
  type Cylinder,
} from "@/hooks/use-cylinders";
import { useWarehouses } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const NONE = "__none__";

/** Base UI's Select emits `string | null` (null when cleared). */
function orUndefined(value: string | null): string | undefined {
  return value && value !== NONE ? value : undefined;
}

const schema = z.object({
  internalCode: z.string().min(1),
  serialNumber: z.string().min(1),
  qrCode: z.string().optional(),
  barcode: z.string().optional(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES),
  conditionStatus: z.enum(CONDITION_STATUSES),
  currentWarehouseId: z.string().optional(),
  currentLocationId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function EditCylinderDialog({
  cylinder,
  onOpenChange,
}: {
  cylinder: Cylinder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateCylinder = useUpdateCylinder();
  const { data: warehouses } = useWarehouses();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (cylinder) {
      reset({
        internalCode: cylinder.internalCode,
        serialNumber: cylinder.serialNumber,
        qrCode: cylinder.qrCode ?? "",
        barcode: cylinder.barcode ?? "",
        availabilityStatus: cylinder.availabilityStatus,
        conditionStatus: cylinder.conditionStatus,
        currentWarehouseId: cylinder.currentWarehouseId ?? undefined,
        currentLocationId: cylinder.currentLocationId ?? undefined,
      });
    }
  }, [cylinder, reset]);

  const selectedWarehouse = warehouses?.find((w) => w.id === watch("currentWarehouseId"));

  async function onSubmit(values: FormValues) {
    if (!cylinder) return;
    try {
      await updateCylinder.mutateAsync({ id: cylinder.id, ...values });
      toast.success("Cylinder updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update cylinder");
    }
  }

  return (
    <Dialog open={cylinder !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit cylinder{cylinder ? `: ${cylinder.internalCode}` : ""}</DialogTitle>
        </DialogHeader>
        {cylinder && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-internalCode">Internal code</Label>
                <Input id="edit-internalCode" {...register("internalCode")} />
                {errors.internalCode && (
                  <p className="text-sm text-destructive">{errors.internalCode.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-serialNumber">Serial number</Label>
                <Input id="edit-serialNumber" {...register("serialNumber")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-qrCode">QR code</Label>
                <Input id="edit-qrCode" {...register("qrCode")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-barcode">Barcode</Label>
                <Input id="edit-barcode" {...register("barcode")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Availability</Label>
                <Select
                  value={watch("availabilityStatus")}
                  onValueChange={(v) => setValue("availabilityStatus", v as FormValues["availabilityStatus"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Condition</Label>
                <Select
                  value={watch("conditionStatus")}
                  onValueChange={(v) => setValue("conditionStatus", v as FormValues["conditionStatus"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button type="submit" disabled={updateCylinder.isPending}>
                {updateCylinder.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
