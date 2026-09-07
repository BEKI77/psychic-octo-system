"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
import { useCustomerCredit } from "@/hooks/use-customers";
import { PAYMENT_METHODS, useConfirmSale, type PaymentMethod, type Sale } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

export function ConfirmSaleDialog({ sale, onDone }: { sale: Sale; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [overrideCredit, setOverrideCredit] = useState(false);

  const confirmSale = useConfirmSale();
  const { data: credit } = useCustomerCredit(sale.customerId);

  const itemsSubtotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = itemsSubtotal - (Number(discount) || 0) + (Number(tax) || 0);
  const outstanding = total - (Number(paymentAmount) || 0);

  const wouldExceedCredit = useMemo(() => {
    if (outstanding <= 0 || !credit) return false;
    if (!credit.creditEnabled) return true;
    return credit.currentCredit + outstanding > credit.creditLimit;
  }, [outstanding, credit]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setDiscount("0");
      setTax("0");
      setPaymentAmount("");
      setPaymentMethod("CASH");
      setOverrideCredit(false);
    }
  }

  async function handleConfirm() {
    try {
      await confirmSale.mutateAsync({
        id: sale.id,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        payment: paymentAmount ? { amount: Number(paymentAmount), method: paymentMethod } : undefined,
        overrideCredit,
      });
      toast.success("Sale confirmed — cylinders issued");
      onOpenChange(false);
      onDone?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to confirm sale");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button disabled={sale.items.length === 0} />}>
        <CheckCircle2 className="size-4" />
        Confirm sale
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm sale {sale.saleNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax">Tax</Label>
              <Input id="tax" type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
            </div>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{itemsSubtotal}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="tabular-nums">{total}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentAmount">Payment amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                placeholder="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Outstanding after payment: <span className="font-medium text-foreground">{outstanding}</span>
          </p>

          {wouldExceedCredit && (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="text-destructive">
                {credit?.creditEnabled
                  ? `This exceeds ${sale.customer.name}'s available credit (§40).`
                  : `${sale.customer.name} is not enabled for credit — full payment is required.`}
              </p>
              <div className="flex items-center gap-2">
                <input
                  id="overrideCredit"
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={overrideCredit}
                  onChange={(e) => setOverrideCredit(e.target.checked)}
                />
                <Label htmlFor="overrideCredit" className="font-normal">
                  Override (requires the CREDIT_APPROVE permission)
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={handleConfirm}
              disabled={confirmSale.isPending || (wouldExceedCredit && !overrideCredit)}
            >
              {confirmSale.isPending ? "Confirming..." : "Confirm & issue"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
