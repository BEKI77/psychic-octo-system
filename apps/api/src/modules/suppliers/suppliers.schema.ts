import { z } from "zod";

export const createSupplierSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  phone: z.string().max(32).optional(),
  email: z.email().optional(),
  address: z.string().max(500).optional(),
  taxNumber: z.string().max(64).optional(),
  contactPerson: z.string().max(200).optional(),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
