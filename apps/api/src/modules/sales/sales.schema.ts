import { z } from "zod";

export const SALE_STATUSES = ["DRAFT", "CONFIRMED", "CANCELLED"] as const;

export const salesFilterSchema = z.object({
  customerId: z.uuid().optional(),
  status: z.enum(SALE_STATUSES).optional(),
});
export type SalesFilter = z.infer<typeof salesFilterSchema>;

export const createSaleSchema = z.object({
  customerId: z.uuid(),
  warehouseId: z.uuid(),
  saleDate: z.iso.date(),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const addSaleItemSchema = z.object({
  cylinderId: z.uuid(),
  // Falls back to the cylinder type's defaultPrice when omitted.
  unitPrice: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().optional(),
});
export type AddSaleItemInput = z.infer<typeof addSaleItemSchema>;

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD", "OTHER"] as const;

export const confirmSaleSchema = z.object({
  discount: z.coerce.number().nonnegative().optional(),
  tax: z.coerce.number().nonnegative().optional(),
  payment: z
    .object({
      amount: z.coerce.number().positive(),
      method: z.enum(PAYMENT_METHODS),
      referenceNumber: z.string().max(100).optional(),
      notes: z.string().max(500).optional(),
    })
    .optional(),
  // Required (in addition to the confirming user holding CREDIT_APPROVE)
  // to push a sale through when it would exceed the customer's credit
  // limit — §40 "A manager can override this if they have the appropriate
  // permission."
  overrideCredit: z.boolean().optional(),
});
export type ConfirmSaleInput = z.infer<typeof confirmSaleSchema>;
