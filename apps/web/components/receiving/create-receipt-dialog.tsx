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
import { useCreateReceipt } from "@/hooks/use-receiving";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useAssignedWarehouses } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const schema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  warehouseId: z.string().min(1, "Select a warehouse"),
  supplierReference: z.string().optional(),
  receivedDate: z.string().min(1, "Required"),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateReceiptDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const createReceipt = useCreateReceipt();
  const { data: suppliers } = useSuppliers();
  const { data: warehouses } = useAssignedWarehouses();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { receivedDate: todayIso() },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset({ receivedDate: todayIso() });
  }

  async function onSubmit(values: FormValues) {
    try {
      const receipt = await createReceipt.mutateAsync(values);
      toast.success(`Draft receipt ${receipt.receiptNumber} created`);
      onOpenChange(false);
      router.push(`/receiving/${receipt.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create receipt");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New receipt
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New receipt</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Supplier</Label>
            <Select value={watch("supplierId")} onValueChange={(v) => setValue("supplierId", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Receiving warehouse</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receivedDate">Received date</Label>
              <Input id="receivedDate" type="date" {...register("receivedDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplierReference">Supplier ref.</Label>
              <Input id="supplierReference" placeholder="Invoice #" {...register("supplierReference")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createReceipt.isPending}>
              {createReceipt.isPending ? "Creating..." : "Create draft"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
