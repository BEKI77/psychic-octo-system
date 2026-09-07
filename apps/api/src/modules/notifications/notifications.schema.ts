import { z } from "zod";

export const notificationFiltersSchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;
