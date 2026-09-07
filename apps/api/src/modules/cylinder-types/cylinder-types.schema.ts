import { z } from "zod";

export const createCylinderTypeSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(200),
  capacityKg: z.coerce.number().positive(),
  brand: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  depositAmount: z.coerce.number().nonnegative().optional(),
  defaultPrice: z.coerce.number().nonnegative().optional(),
});
export type CreateCylinderTypeInput = z.infer<typeof createCylinderTypeSchema>;

export const updateCylinderTypeSchema = createCylinderTypeSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateCylinderTypeInput = z.infer<typeof updateCylinderTypeSchema>;
