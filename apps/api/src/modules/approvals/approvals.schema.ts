import { z } from "zod";

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const approvalFiltersSchema = z.object({
  status: z.enum(APPROVAL_STATUSES).optional(),
  type: z.string().max(64).optional(),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(128).optional(),
});
export type ApprovalFilters = z.infer<typeof approvalFiltersSchema>;

export const decideApprovalSchema = z.object({
  reviewNotes: z.string().max(1000).optional(),
});
export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;
