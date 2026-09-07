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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddReceiptItem, type Receipt } from "@/hooks/use-receiving";
import { useCylinderTypes } from "@/hooks/use-cylinder-types";
import { CONDITION_STATUSES, useCylinders } from "@/hooks/use-cylinders";
import { ApiError } from "@/lib/api";

const newSchema = z.object({
  cylinderTypeId: z.string().min(1, "Select a cylinder type"),
  internalCode: z.string().min(1),
  serialNumber: z.string().min(1),
  qrCode: z.string().optional(),
  barcode: z.string().optional(),
  locationId: z.string().optional(),
  conditionStatus: z.enum(CONDITION_STATUSES).optional(),
  notes: z.string().optional(),
});
type NewFormValues = z.infer<typeof newSchema>;

export function AddItemDialog({ receipt }: { receipt: Receipt }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [search, setSearch] = useState("");
  const [selectedCylinderId, setSelectedCylinderId] = useState<string | null>(null);

  const addItem = useAddReceiptItem(receipt.id);
  const { data: types } = useCylinderTypes();
  const { data: candidates } = useCylinders({ search: search || undefined });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewFormValues>({ resolver: zodResolver(newSchema) });

  const locations = receipt.warehouse.locations;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setSearch("");
      setSelectedCylinderId(null);
      setMode("new");
    }
  }

  async function onSubmitNew(values: NewFormValues) {
    try {
      await addItem.mutateAsync({ newCylinder: values, locationId: values.locationId, conditionStatus: values.conditionStatus, notes: values.notes });
      toast.success("Cylinder added to receipt");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add item");
    }
  }

  async function onSubmitExisting() {
    if (!selectedCylinderId) {
      toast.error("Select a cylinder first");
      return;
    }
    try {
      await addItem.mutateAsync({ cylinderId: selectedCylinderId });
      toast.success("Cylinder added to receipt");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add item");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Add cylinder
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add cylinder to receipt</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "new" | "existing")}>
          <TabsList className="w-full">
            <TabsTrigger value="new" className="flex-1">
              Register new
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex-1">
              Existing cylinder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="pt-2">
            <form onSubmit={handleSubmit(onSubmitNew)} className="flex flex-col gap-4">
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
                  <Input id="internalCode" {...register("internalCode")} />
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
                  <Label>Location</Label>
                  <Select
                    value={watch("locationId")}
                    onValueChange={(v) => setValue("locationId", v ?? undefined)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Condition on arrival</Label>
                  <Select
                    value={watch("conditionStatus")}
                    onValueChange={(v) =>
                      setValue("conditionStatus", v as NewFormValues["conditionStatus"])
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="GOOD" />
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register("notes")} />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={addItem.isPending}>
                  {addItem.isPending ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="existing" className="flex flex-col gap-3 pt-2">
            <Input
              placeholder="Search internal code or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-md border p-1">
              {candidates?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCylinderId(c.id)}
                  className={`flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                    selectedCylinderId === c.id ? "bg-muted" : ""
                  }`}
                >
                  <span className="font-medium">
                    {c.internalCode} · {c.serialNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.cylinderType.code} — {c.availabilityStatus}
                  </span>
                </button>
              ))}
              {candidates?.length === 0 && (
                <p className="p-2 text-sm text-muted-foreground">No cylinders match.</p>
              )}
            </div>
            <DialogFooter>
              <Button onClick={onSubmitExisting} disabled={addItem.isPending || !selectedCylinderId}>
                {addItem.isPending ? "Adding..." : "Add selected"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
