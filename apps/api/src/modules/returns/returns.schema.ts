import { z } from "zod";
import { CONDITION_STATUSES } from "../cylinders/cylinders.schema.js";

export const RETURN_STATUSES = ["DRAFT", "RECEIVED", "INSPECTED", "COMPLETED", "CANCELLED"] as const;
export const INSPECTION_RESULTS = ["GOOD", "DAMAGED", "NEEDS_REPAIR"] as const;

export const createReturnSchema = z.object({
  customerId: z.uuid(),
  warehouseId: z.uuid(),
  returnDate: z.iso.date(),
  notes: z.string().max(1000).optional(),
});
export type CreateReturnInput = z.infer<typeof createReturnSchema>;

export const addReturnItemSchema = z.object({
  saleItemId: z.uuid(),
  conditionAtReturn: z.enum(CONDITION_STATUSES),
  locationId: z.uuid().optional(),
  // §41 Return validation: normally the cylinder must still belong to this
  // customer. An authorized override (still gated by INVENTORY_RETURN) lets
  // an exceptional case through, logged in the transaction notes.
  overrideOwnership: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});
export type AddReturnItemInput = z.infer<typeof addReturnItemSchema>;

export const inspectReturnSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.uuid(),
        inspectionResult: z.enum(INSPECTION_RESULTS),
        // Defaults to the original sale item's subtotal (full credit) when omitted.
        financialAdjustment: z.coerce.number().nonnegative().optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .min(1),
});
export type InspectReturnInput = z.infer<typeof inspectReturnSchema>;

export const returnsFilterSchema = z.object({
  customerId: z.uuid().optional(),
  status: z.enum(RETURN_STATUSES).optional(),
});
export type ReturnsFilter = z.infer<typeof returnsFilterSchema>;
