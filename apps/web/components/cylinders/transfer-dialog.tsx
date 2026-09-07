"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Cylinder } from "@/hooks/use-cylinders";
import { useTransfer } from "@/hooks/use-inventory";
import { useAssignedWarehouses } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

export function TransferDialog({
  cylinder,
  onOpenChange,
}: {
  cylinder: Cylinder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const transfer = useTransfer();
  const { data: warehouses } = useAssignedWarehouses();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!cylinder) {
      setWarehouseId(undefined);
      setLocationId(undefined);
      setNotes("");
    }
  }, [cylinder]);

  const selectedWarehouse = warehouses?.find((w) => w.id === warehouseId);

  async function handleSubmit() {
    if (!cylinder || !warehouseId) return;
    try {
      await transfer.mutateAsync({
        cylinderIds: [cylinder.id],
        toWarehouseId: warehouseId,
        toLocationId: locationId,
        notes: notes || undefined,
      });
      toast.success(`${cylinder.internalCode} transferred`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to transfer cylinder");
    }
  }

  return (
    <Dialog open={cylinder !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer{cylinder ? `: ${cylinder.internalCode}` : ""}</DialogTitle>
        </DialogHeader>
        {cylinder && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Currently at {cylinder.currentWarehouse?.code ?? "unassigned"}
              {cylinder.currentLocation ? ` / ${cylinder.currentLocation.code}` : ""}.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label>Destination warehouse</Label>
              <Select
                value={warehouseId}
                onValueChange={(v) => {
                  setWarehouseId(v ?? undefined);
                  setLocationId(undefined);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    ?.filter((w) => w.id !== cylinder.currentWarehouseId)
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.code} — {w.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Destination location</Label>
              <Select
                value={locationId}
                onValueChange={(v) => setLocationId(v ?? undefined)}
                disabled={!selectedWarehouse}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {selectedWarehouse?.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="transfer-notes">Notes</Label>
              <Input id="transfer-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!warehouseId || transfer.isPending}>
                {transfer.isPending ? "Transferring..." : "Transfer"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
