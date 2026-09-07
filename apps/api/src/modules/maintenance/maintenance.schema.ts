import { z } from "zod";

export const MAINTENANCE_TYPES = ["REPAIR", "OTHER"] as const;
export const MAINTENANCE_STATUSES = ["REPORTED", "IN_REPAIR", "COMPLETED", "CANCELLED"] as const;

export const createMaintenanceSchema = z.object({
  cylinderId: z.uuid(),
  maintenanceType: z.enum(MAINTENANCE_TYPES).optional(),
  description: z.string().max(1000).optional(),
});
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const completeMaintenanceSchema = z.object({
  cost: z.coerce.number().nonnegative().optional(),
});
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;

export const maintenanceFilterSchema = z.object({
  cylinderId: z.uuid().optional(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
});
export type MaintenanceFilter = z.infer<typeof maintenanceFilterSchema>;
