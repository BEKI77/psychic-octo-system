"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateSale } from "@/hooks/use-sales";
import { useCustomers } from "@/hooks/use-customers";
import { useAssignedWarehouses } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  saleDate: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateSaleDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createSale = useCreateSale();
  const { data: customers } = useCustomers();
  const { data: warehouses } = useAssignedWarehouses();

  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { saleDate: todayIso() },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset({ saleDate: todayIso() });
  }

  async function onSubmit(values: FormValues) {
    try {
      const sale = await createSale.mutateAsync(values);
      toast.success(`Draft sale ${sale.saleNumber} created`);
      onOpenChange(false);
      router.push(`/sales/${sale.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create sale");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New sale
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New sale</DialogTitle>
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

          <div className="flex flex-col gap-1.5">
            <Label>Issuing warehouse</Label>
            <Select value={watch("warehouseId")} onValueChange={(v) => setValue("warehouseId", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouseId && <p className="text-sm text-destructive">{errors.warehouseId.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="saleDate">Sale date</Label>
            <Input id="saleDate" type="date" {...register("saleDate")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createSale.isPending}>
              {createSale.isPending ? "Creating..." : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
