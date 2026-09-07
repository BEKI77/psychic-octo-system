"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
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
import {
  INSPECTION_RESULTS,
  useInspectReturn,
  type InspectionResult,
  type Return,
} from "@/hooks/use-returns";
import { ApiError } from "@/lib/api";

interface RowState {
  inspectionResult: InspectionResult;
  financialAdjustment: string;
}

export function InspectReturnDialog({ ret }: { ret: Return }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const inspectReturn = useInspectReturn();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setRows(
        Object.fromEntries(
          ret.items.map((item) => [
            item.id,
            { inspectionResult: "GOOD" as InspectionResult, financialAdjustment: String(item.saleItem.subtotal) },
          ]),
        ),
      );
    }
  }

  function updateRow(itemId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
  }

  async function handleSubmit() {
    try {
      await inspectReturn.mutateAsync({
        id: ret.id,
        items: ret.items.map((item) => ({
          itemId: item.id,
          inspectionResult: rows[item.id].inspectionResult,
          financialAdjustment: Number(rows[item.id].financialAdjustment) || 0,
        })),
      });
      toast.success("Return inspected");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to record inspection");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button disabled={ret.items.length === 0} />}>
        <ClipboardCheck className="size-4" />
        Inspect
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inspect {ret.returnNumber}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Every received cylinder must be given an outcome (§22). GOOD is issuable immediately; DAMAGED is
          held; NEEDS_REPAIR opens a maintenance record.
        </p>
        <div className="flex flex-col gap-4">
          {ret.items.map((item) => {
            const row = rows[item.id];
            if (!row) return null;
            return (
              <div key={item.id} className="flex flex-col gap-2 rounded-md border p-3">
                <p className="text-sm font-medium">
                  {item.cylinder.internalCode}{" "}
                  <span className="font-normal text-muted-foreground">
                    · reported {item.conditionAtReturn.replace("_", " ")}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Result</Label>
                    <Select
                      value={row.inspectionResult}
                      onValueChange={(v) => updateRow(item.id, { inspectionResult: v as InspectionResult })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INSPECTION_RESULTS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Financial adjustment</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.financialAdjustment}
                      onChange={(e) => updateRow(item.id, { financialAdjustment: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={inspectReturn.isPending}>
            {inspectReturn.isPending ? "Saving..." : "Submit inspection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
