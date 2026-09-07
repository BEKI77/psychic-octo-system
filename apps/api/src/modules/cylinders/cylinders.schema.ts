import { z } from "zod";

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "WITH_CUSTOMER",
  "IN_TRANSIT",
  "BLOCKED",
  "SCRAPPED",
] as const;

export const CONDITION_STATUSES = [
  "GOOD",
  "DAMAGED",
  "NEEDS_INSPECTION",
  "UNDER_REPAIR",
  "REPAIRED",
  "SCRAPPED",
] as const;

export const createCylinderSchema = z.object({
  cylinderTypeId: z.uuid(),
  internalCode: z.string().min(1).max(64),
  serialNumber: z.string().min(1).max(64),
  qrCode: z.string().min(1).max(128).optional(),
  barcode: z.string().min(1).max(128).optional(),
  manufactureDate: z.iso.date().optional(),
  purchaseDate: z.iso.date().optional(),
  conditionStatus: z.enum(CONDITION_STATUSES).optional(),
  currentWarehouseId: z.uuid().optional(),
  currentLocationId: z.uuid().optional(),
});
export type CreateCylinderInput = z.infer<typeof createCylinderSchema>;

export const updateCylinderSchema = z.object({
  cylinderTypeId: z.uuid().optional(),
  internalCode: z.string().min(1).max(64).optional(),
  serialNumber: z.string().min(1).max(64).optional(),
  qrCode: z.string().min(1).max(128).nullable().optional(),
  barcode: z.string().min(1).max(128).nullable().optional(),
  manufactureDate: z.iso.date().nullable().optional(),
  purchaseDate: z.iso.date().nullable().optional(),
  availabilityStatus: z.enum(AVAILABILITY_STATUSES).optional(),
  conditionStatus: z.enum(CONDITION_STATUSES).optional(),
  currentWarehouseId: z.uuid().nullable().optional(),
  currentLocationId: z.uuid().nullable().optional(),
});
export type UpdateCylinderInput = z.infer<typeof updateCylinderSchema>;

export const cylinderFiltersSchema = z.object({
  status: z.enum(AVAILABILITY_STATUSES).optional(),
  condition: z.enum(CONDITION_STATUSES).optional(),
  type: z.uuid().optional(),
  warehouse: z.uuid().optional(),
  location: z.uuid().optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type CylinderFilters = z.infer<typeof cylinderFiltersSchema>;
