"use client";

import { useState } from "react";
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
import { useCylinders } from "@/hooks/use-cylinders";
import { useAddSaleItem, type Sale } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

export function AddSaleItemDialog({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unitPrice, setUnitPrice] = useState("");

  const addItem = useAddSaleItem(sale.id);
  const { data: candidates } = useCylinders({
    warehouse: sale.warehouseId,
    status: "AVAILABLE",
    condition: "GOOD",
    search: search || undefined,
  });

  const selected = candidates?.find((c) => c.id === selectedId);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSearch("");
      setSelectedId(null);
      setUnitPrice("");
    }
  }

  async function handleSubmit() {
    if (!selectedId) return;
    try {
      await addItem.mutateAsync({
        cylinderId: selectedId,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
      });
      toast.success("Cylinder added");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add cylinder to sale</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Only AVAILABLE, GOOD-condition cylinders at {sale.warehouse.code} can be issued (§41).
          </p>
          <Input
            placeholder="Search internal code or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border p-1">
            {candidates?.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setUnitPrice(c.cylinderType.defaultPrice != null ? String(c.cylinderType.defaultPrice) : "");
                }}
                className={`flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                  selectedId === c.id ? "bg-muted" : ""
                }`}
              >
                <span className="font-medium">
                  {c.internalCode} · {c.serialNumber}
                </span>
                <span className="text-xs text-muted-foreground">{c.cylinderType.code}</span>
              </button>
            ))}
            {candidates?.length === 0 && (
              <p className="p-2 text-sm text-muted-foreground">No available cylinders match.</p>
            )}
          </div>

          {selected && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitPrice">Unit price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!selectedId || !unitPrice || addItem.isPending}>
              {addItem.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
