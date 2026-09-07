import { z } from "zod";

export const auditLogFiltersSchema = z.object({
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(128).optional(),
  userId: z.uuid().optional(),
  action: z.string().max(64).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>;
