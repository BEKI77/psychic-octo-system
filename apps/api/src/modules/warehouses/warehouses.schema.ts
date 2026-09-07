import { z } from "zod";

export const createWarehouseSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(32).optional(),
});
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

export const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

export const LOCATION_TYPES = [
  "ZONE",
  "RACK",
  "AREA",
  "REPAIR",
  "INSPECTION",
  "DISPATCH",
  "SCRAP",
] as const;

export const createLocationSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  locationType: z.enum(LOCATION_TYPES),
  parentId: z.uuid().optional(),
});
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  locationType: z.enum(LOCATION_TYPES).optional(),
  parentId: z.uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
