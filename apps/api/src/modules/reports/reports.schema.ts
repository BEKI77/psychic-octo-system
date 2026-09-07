import { z } from "zod";

export const dateRangeSchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  customerId: z.uuid().optional(),
});
export type DateRangeFilter = z.infer<typeof dateRangeSchema>;
