import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AvailabilityStatus, ConditionStatus } from "./use-cylinders";

export interface InventorySummary {
  totalCylinders: number;
  byAvailability: { status: AvailabilityStatus; value: number }[];
  byCondition: { status: ConditionStatus; value: number }[];
  todayActivity: { type: string; value: number }[];
}

export interface StockRow {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  cylinderTypeId: string;
  cylinderTypeCode: string;
  availabilityStatus: AvailabilityStatus;
  value: number;
}

export interface MovementRef {
  id: string;
  code: string;
}

export interface Movement {
  id: string;
  transactionNumber: string;
  transactionType: string;
  transactionDate: string;
  notes: string | null;
  conditionBefore: ConditionStatus | null;
  conditionAfter: ConditionStatus | null;
  cylinder: { id: string; internalCode: string; serialNumber: string };
  fromWarehouse: MovementRef | null;
  toWarehouse: MovementRef | null;
  fromLocation: MovementRef | null;
  toLocation: MovementRef | null;
  performedByUser: { id: string; username: string; firstName: string; lastName: string };
}

export interface TransferInput {
  cylinderIds: string[];
  toWarehouseId: string;
  toLocationId?: string;
  notes?: string;
}

export interface AdjustmentInput {
  cylinderId: string;
  availabilityStatus?: AvailabilityStatus;
  conditionStatus?: ConditionStatus;
  notes: string;
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ["inventory", "summary"],
    queryFn: () => api.get<InventorySummary>("/inventory/summary"),
    refetchInterval: 30_000,
  });
}

export function useStock() {
  return useQuery({ queryKey: ["inventory", "stock"], queryFn: () => api.get<StockRow[]>("/inventory/stock") });
}

export function useMovements(filters: { cylinderId?: string; transactionType?: string } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();

  return useQuery({
    queryKey: ["inventory", "movements", filters],
    queryFn: () => api.get<Movement[]>(`/inventory/movements${query ? `?${query}` : ""}`),
  });
}

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["inventory"] });
  queryClient.invalidateQueries({ queryKey: ["cylinders"] });
  queryClient.invalidateQueries({ queryKey: ["warehouses"] });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferInput) => api.post<{ transferred: number }>("/inventory/transfer", input),
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustmentInput) => api.post("/inventory/adjustment", input),
    onSuccess: () => invalidateInventory(queryClient),
  });
}
