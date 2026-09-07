import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CylinderType } from "./use-cylinder-types";

export const MAINTENANCE_TYPES = ["REPAIR", "OTHER"] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export type MaintenanceStatus = "REPORTED" | "IN_REPAIR" | "COMPLETED" | "CANCELLED";

export interface MaintenanceRecord {
  id: string;
  maintenanceNumber: string;
  cylinderId: string;
  maintenanceType: MaintenanceType;
  description: string | null;
  reportedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cost: number | null;
  status: MaintenanceStatus;
  cylinder: { id: string; internalCode: string; serialNumber: string; cylinderType: CylinderType };
  performedByUser: { id: string; username: string } | null;
  approvedByUser: { id: string; username: string } | null;
}

export interface CreateMaintenanceInput {
  cylinderId: string;
  maintenanceType?: MaintenanceType;
  description?: string;
}

export function useMaintenanceRecords(filters: { status?: MaintenanceStatus } = {}) {
  const query = filters.status ? `?status=${filters.status}` : "";
  return useQuery({
    queryKey: ["maintenance", filters],
    queryFn: () => api.get<MaintenanceRecord[]>(`/maintenance${query}`),
  });
}

function invalidateMaintenance(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["maintenance"] });
  queryClient.invalidateQueries({ queryKey: ["cylinders"] });
  queryClient.invalidateQueries({ queryKey: ["inventory"] });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMaintenanceInput) => api.post<MaintenanceRecord>("/maintenance", input),
    onSuccess: () => invalidateMaintenance(queryClient),
  });
}

export function useStartMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<MaintenanceRecord>(`/maintenance/${id}/start`),
    onSuccess: () => invalidateMaintenance(queryClient),
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cost }: { id: string; cost?: number }) =>
      api.post<MaintenanceRecord>(`/maintenance/${id}/complete`, { cost }),
    onSuccess: () => invalidateMaintenance(queryClient),
  });
}

export function useCancelMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<MaintenanceRecord>(`/maintenance/${id}/cancel`),
    onSuccess: () => invalidateMaintenance(queryClient),
  });
}
