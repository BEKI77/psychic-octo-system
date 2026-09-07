import { z } from "zod";
import { AVAILABILITY_STATUSES, CONDITION_STATUSES } from "../cylinders/cylinders.schema.js";

export const transactionTypeValues = [
  "RECEIVE",
  "ISSUE",
  "RETURN",
  "TRANSFER",
  "MOVE",
  "INSPECTION",
  "REPAIR_START",
  "REPAIR_COMPLETE",
  "DAMAGE",
  "SCRAP",
  "ADJUSTMENT",
] as const;

export const transferSchema = z.object({
  cylinderIds: z.array(z.uuid()).min(1),
  toWarehouseId: z.uuid(),
  toLocationId: z.uuid().optional(),
  notes: z.string().max(500).optional(),
});
export type TransferInput = z.infer<typeof transferSchema>;

export const adjustmentSchema = z
  .object({
    cylinderId: z.uuid(),
    availabilityStatus: z.enum(AVAILABILITY_STATUSES).optional(),
    conditionStatus: z.enum(CONDITION_STATUSES).optional(),
    notes: z.string().min(1, "A reason is required for manual adjustments").max(500),
  })
  .refine((v) => Boolean(v.availabilityStatus) || Boolean(v.conditionStatus), {
    message: "Provide at least one of availabilityStatus or conditionStatus",
  });
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

export const movementsQuerySchema = z.object({
  cylinderId: z.uuid().optional(),
  warehouseId: z.uuid().optional(),
  transactionType: z.enum(transactionTypeValues).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type MovementsQuery = z.infer<typeof movementsQuerySchema>;
