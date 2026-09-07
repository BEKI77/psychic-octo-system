"use client";

import { useMemo, useState } from "react";
import { SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAllocatePayment, type Payment } from "@/hooks/use-payments";
import { useSales } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

export function AllocatePaymentDialog({
  payment,
  onOpenChange,
}: {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const allocatePayment = useAllocatePayment();
  const { data: sales } = useSales({ customerId: payment?.customerId, status: "CONFIRMED" });

  const outstanding = useMemo(
    () => (sales ?? []).filter((s) => s.outstandingAmount > 0),
    [sales],
  );

  const totalEntered = Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const remaining = (payment?.unallocatedAmount ?? 0) - totalEntered;

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setAmounts({});
  }

  async function handleSubmit() {
    if (!payment) return;
    const allocations = Object.entries(amounts)
      .filter(([, v]) => Number(v) > 0)
      .map(([saleId, v]) => ({ saleId, amount: Number(v) }));
    if (allocations.length === 0) {
      toast.error("Enter an amount for at least one sale");
      return;
    }
    try {
      await allocatePayment.mutateAsync({ id: payment.id, allocations });
      toast.success("Payment allocated");
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to allocate payment");
    }
  }

  return (
    <Dialog open={payment !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Allocate {payment?.paymentNumber}</DialogTitle>
        </DialogHeader>
        {payment && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {payment.unallocatedAmount} unallocated · split it across this customer&apos;s outstanding
              sales (§18).
            </p>

            <div className="flex flex-col gap-3">
              {outstanding.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{sale.saleNumber}</p>
                    <p className="text-xs text-muted-foreground">Outstanding: {sale.outstandingAmount}</p>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28"
                    placeholder="0"
                    value={amounts[sale.id] ?? ""}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [sale.id]: e.target.value }))}
                  />
                </div>
              ))}
              {outstanding.length === 0 && (
                <p className="text-sm text-muted-foreground">No outstanding sales for this customer.</p>
              )}
            </div>

            <p className={`text-sm ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              Remaining to allocate: <span className="font-medium">{remaining}</span>
            </p>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={allocatePayment.isPending || remaining < 0}>
                {allocatePayment.isPending ? "Allocating..." : "Allocate"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
