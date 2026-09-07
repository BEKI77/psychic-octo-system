import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface ApprovalRequest {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  status: ApprovalStatus;
  reason: string | null;
  payload: Record<string, unknown> | null;
  requestedBy: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedByUser: { id: string; username: string; firstName: string; lastName: string };
  reviewedByUser: { id: string; username: string; firstName: string; lastName: string } | null;
}

export interface ApprovalFilters {
  status?: ApprovalStatus;
  type?: string;
  entityType?: string;
  entityId?: string;
}

export function useApprovals(filters: ApprovalFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();

  return useQuery({
    queryKey: ["approvals", filters],
    queryFn: () => api.get<ApprovalRequest[]>(`/approvals${query ? `?${query}` : ""}`),
  });
}

function invalidateApprovals(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["approvals"] });
  queryClient.invalidateQueries({ queryKey: ["returns"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes?: string }) =>
      api.post<ApprovalRequest>(`/approvals/${id}/approve`, { reviewNotes }),
    onSuccess: () => invalidateApprovals(queryClient),
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes?: string }) =>
      api.post<ApprovalRequest>(`/approvals/${id}/reject`, { reviewNotes }),
    onSuccess: () => invalidateApprovals(queryClient),
  });
}
