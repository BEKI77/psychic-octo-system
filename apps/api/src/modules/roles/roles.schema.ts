import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Upper-case letters, numbers and underscores only"),
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.uuid()).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.uuid()).optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
