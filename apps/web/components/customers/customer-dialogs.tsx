"use client";

import { useEffect, useState } from "react";
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
import {
  CUSTOMER_TYPES,
  useCreateCustomer,
  useUpdateCustomer,
  type Customer,
  type CustomerType,
} from "@/hooks/use-customers";
import { ApiError } from "@/lib/api";

const schema = z.object({
  customerCode: z.string().min(1),
  name: z.string().min(1),
  customerType: z.enum(CUSTOMER_TYPES),
  phone: z.string().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  creditEnabled: z.boolean(),
  creditLimit: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function Fields({
  register,
  errors,
  watch,
  setValue,
  disableCode,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  watch: ReturnType<typeof useForm<FormValues>>["watch"];
  setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
  disableCode?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customerCode">Code</Label>
          <Input id="customerCode" disabled={disableCode} {...register("customerCode")} />
          {errors.customerCode && <p className="text-sm text-destructive">{errors.customerCode.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select value={watch("customerType")} onValueChange={(v) => setValue("customerType", v as CustomerType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="taxNumber">Tax number</Label>
        <Input id="taxNumber" {...register("taxNumber")} />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="creditEnabled"
          type="checkbox"
          className="size-4 rounded border-input"
          checked={watch("creditEnabled")}
          onChange={(e) => setValue("creditEnabled", e.target.checked)}
        />
        <Label htmlFor="creditEnabled" className="font-normal">
          Allow this customer to take cylinders on credit
        </Label>
      </div>

      {watch("creditEnabled") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="creditLimit">Credit limit</Label>
          <Input id="creditLimit" type="number" step="0.01" {...register("creditLimit")} />
        </div>
      )}
    </>
  );
}

export function CreateCustomerDialog() {
  const [open, setOpen] = useState(false);
  const createCustomer = useCreateCustomer();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerType: "INDIVIDUAL", creditEnabled: false },
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset({ customerType: "INDIVIDUAL", creditEnabled: false });
  }

  async function onSubmit(values: FormValues) {
    try {
      await createCustomer.mutateAsync({
        ...values,
        creditLimit: values.creditLimit ? Number(values.creditLimit) : undefined,
      });
      toast.success("Customer created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create customer");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New customer
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Fields register={register} errors={errors} watch={watch} setValue={setValue} />
          <DialogFooter>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditCustomerDialog({
  customer,
  onOpenChange,
}: {
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateCustomer = useUpdateCustomer();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (customer) {
      reset({
        customerCode: customer.customerCode,
        name: customer.name,
        customerType: customer.customerType,
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        address: customer.address ?? "",
        taxNumber: customer.taxNumber ?? "",
        creditEnabled: customer.creditEnabled,
        creditLimit: String(customer.creditLimit),
      });
    }
  }, [customer, reset]);

  async function onSubmit(values: FormValues) {
    if (!customer) return;
    try {
      const { customerCode: _code, ...patch } = values;
      await updateCustomer.mutateAsync({
        id: customer.id,
        ...patch,
        creditLimit: patch.creditLimit ? Number(patch.creditLimit) : undefined,
      });
      toast.success("Customer updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update customer");
    }
  }

  return (
    <Dialog open={customer !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        {customer && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Fields register={register} errors={errors} watch={watch} setValue={setValue} disableCode />
            <DialogFooter>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
