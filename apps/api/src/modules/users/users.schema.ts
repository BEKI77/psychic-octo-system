import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dot, underscore and hyphen only"),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(32).optional(),
  roleIds: z.array(z.uuid()).default([]),
  // §66 Phase 8 Multiple Warehouses — omitted/empty means unrestricted, not "no access".
  warehouseIds: z.array(z.uuid()).default([]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(32).nullable().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.uuid()).optional(),
  warehouseIds: z.array(z.uuid()).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
