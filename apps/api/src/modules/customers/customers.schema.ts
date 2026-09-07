import { z } from "zod";

export const CUSTOMER_TYPES = ["INDIVIDUAL", "BUSINESS", "WHOLESALE", "DISTRIBUTOR", "RETAIL"] as const;
export const CUSTOMER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;

export const createCustomerSchema = z.object({
  customerCode: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  phone: z.string().max(32).optional(),
  email: z.email().optional(),
  address: z.string().max(500).optional(),
  taxNumber: z.string().max(64).optional(),
  creditLimit: z.coerce.number().nonnegative().optional(),
  creditEnabled: z.boolean().optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  phone: z.string().max(32).optional(),
  email: z.email().optional(),
  address: z.string().max(500).optional(),
  taxNumber: z.string().max(64).optional(),
  creditLimit: z.coerce.number().nonnegative().optional(),
  creditEnabled: z.boolean().optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
});
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
