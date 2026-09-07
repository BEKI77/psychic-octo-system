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
import { useCustomers } from "@/hooks/use-customers";
import { useCreatePayment } from "@/hooks/use-payments";
import { PAYMENT_METHODS, type PaymentMethod } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  amount: z.string().min(1, "Required"),
  method: z.enum(PAYMENT_METHODS),
  paymentDate: z.string().min(1, "Required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreatePaymentDialog() {
  const [open, setOpen] = useState(false);
  const createPayment = useCreatePayment();
  const { data: customers } = useCustomers();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { method: "CASH", paymentDate: todayIso() },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset({ method: "CASH", paymentDate: todayIso() });
  }

  async function onSubmit(values: FormValues) {
    try {
      await createPayment.mutateAsync({ ...values, amount: Number(values.amount) });
      toast.success("Payment recorded — allocate it to an invoice next");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to record payment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Record payment
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Customer</Label>
            <Select value={watch("customerId")} onValueChange={(v) => setValue("customerId", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.customerCode} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && <p className="text-sm text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <Select value={watch("method")} onValueChange={(v) => setValue("method", v as PaymentMethod)}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentDate">Date</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referenceNumber">Reference #</Label>
              <Input id="referenceNumber" {...register("referenceNumber")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? "Recording..." : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
