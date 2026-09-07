"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SupplierFormValues {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  contactPerson?: string;
}

export function SupplierFormFields({
  register,
  errors,
  disableCode,
}: {
  register: UseFormRegister<SupplierFormValues>;
  errors: FieldErrors<SupplierFormValues>;
  disableCode?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" disabled={disableCode} {...register("code")} />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
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
        <Label htmlFor="contactPerson">Contact person</Label>
        <Input id="contactPerson" {...register("contactPerson")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="taxNumber">Tax number</Label>
        <Input id="taxNumber" {...register("taxNumber")} />
      </div>
    </>
  );
}
