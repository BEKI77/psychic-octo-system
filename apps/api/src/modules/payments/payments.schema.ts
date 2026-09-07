import { z } from "zod";

export const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD", "OTHER"] as const;

export const paymentsFilterSchema = z.object({
  customerId: z.uuid().optional(),
});
export type PaymentsFilter = z.infer<typeof paymentsFilterSchema>;

export const createPaymentSchema = z.object({
  customerId: z.uuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  paymentDate: z.iso.date(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/** §18 Payment Allocation — splits an (already-received) payment across one or more outstanding sales. */
export const allocatePaymentSchema = z.object({
  allocations: z
    .array(
      z.object({
        saleId: z.uuid(),
        amount: z.coerce.number().positive(),
      }),
    )
    .min(1),
});
export type AllocatePaymentInput = z.infer<typeof allocatePaymentSchema>;
