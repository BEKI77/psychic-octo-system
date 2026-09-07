import { z } from "zod";
import { CONDITION_STATUSES } from "../cylinders/cylinders.schema.js";

export const createReceiptSchema = z.object({
  supplierId: z.uuid(),
  warehouseId: z.uuid(),
  supplierReference: z.string().max(100).optional(),
  receivedDate: z.iso.date(),
  notes: z.string().max(1000).optional(),
});
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;

export const updateReceiptSchema = z.object({
  supplierReference: z.string().max(100).optional(),
  receivedDate: z.iso.date().optional(),
  notes: z.string().max(1000).optional(),
});
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;

const newCylinderSchema = z.object({
  cylinderTypeId: z.uuid(),
  internalCode: z.string().min(1).max(64),
  serialNumber: z.string().min(1).max(64),
  qrCode: z.string().min(1).max(128).optional(),
  barcode: z.string().min(1).max(128).optional(),
});

export const addReceiptItemSchema = z
  .object({
    cylinderId: z.uuid().optional(),
    newCylinder: newCylinderSchema.optional(),
    locationId: z.uuid().optional(),
    conditionStatus: z.enum(CONDITION_STATUSES).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.cylinderId) !== Boolean(v.newCylinder), {
    message: "Provide exactly one of cylinderId or newCylinder",
    path: ["cylinderId"],
  });
export type AddReceiptItemInput = z.infer<typeof addReceiptItemSchema>;
