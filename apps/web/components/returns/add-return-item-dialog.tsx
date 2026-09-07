"use client";

import { useMemo, useState } from "react";
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
import { CONDITION_STATUSES, type ConditionStatus } from "@/hooks/use-cylinders";
import { useAddReturnItem, type Return } from "@/hooks/use-returns";
import { useSales } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

export function AddReturnItemDialog({ ret }: { ret: Return }) {
  const [open, setOpen] = useState(false);
  const [saleItemId, setSaleItemId] = useState<string | undefined>();
  const [condition, setCondition] = useState<ConditionStatus>("GOOD");
  const [overrideOwnership, setOverrideOwnership] = useState(false);

  const addItem = useAddReturnItem(ret.id);
  const { data: sales } = useSales({ customerId: ret.customerId, status: "CONFIRMED" });

  const alreadyInThisReturn = new Set(ret.items.map((i) => i.saleItemId));
  const returnable = useMemo(
    () =>
      (sales ?? []).flatMap((sale) =>
        sale.items
          .filter((item) => item.cylinder.availabilityStatus === "WITH_CUSTOMER")
          .filter((item) => !alreadyInThisReturn.has(item.id))
          .map((item) => ({ ...item, saleNumber: sale.saleNumber })),
      ),
    [sales, alreadyInThisReturn],
  );

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSaleItemId(undefined);
      setCondition("GOOD");
      setOverrideOwnership(false);
    }
  }

  async function handleSubmit() {
    if (!saleItemId) return;
    try {
      await addItem.mutateAsync({
        saleItemId,
        conditionAtReturn: condition,
        overrideOwnership: overrideOwnership || undefined,
      });
      toast.success("Cylinder received into inspection");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add return item");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Receive cylinder
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive returned cylinder</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Cylinder (from a confirmed sale, still with the customer)</Label>
            <Select value={saleItemId} onValueChange={(v) => setSaleItemId(v ?? undefined)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a cylinder" />
              </SelectTrigger>
              <SelectContent>
                {returnable.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.cylinder.internalCode} · {item.saleNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {returnable.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No cylinders currently held by this customer are eligible for return.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Condition on physical return</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as ConditionStatus)}>
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
            <p className="text-xs text-muted-foreground">
              This is just what the worker observes now — the formal outcome is set at inspection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="overrideOwnership"
              type="checkbox"
              className="size-4 rounded border-input"
              checked={overrideOwnership}
              onChange={(e) => setOverrideOwnership(e.target.checked)}
            />
            <Label htmlFor="overrideOwnership" className="font-normal">
              Override ownership check (exceptional cases, §41)
            </Label>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!saleItemId || addItem.isPending}>
              {addItem.isPending ? "Receiving..." : "Receive"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
