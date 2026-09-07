import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ConditionStatus } from "./use-cylinders";
import type { CylinderType } from "./use-cylinder-types";
import type { Customer } from "./use-customers";
import type { Warehouse } from "./use-warehouses";

export type ReturnStatus = "DRAFT" | "RECEIVED" | "INSPECTED" | "COMPLETED" | "CANCELLED";
export const INSPECTION_RESULTS = ["GOOD", "DAMAGED", "NEEDS_REPAIR"] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];

interface ReturnUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  saleItemId: string;
  cylinderId: string;
  conditionAtReturn: ConditionStatus;
  inspectionResult: InspectionResult | null;
  financialAdjustment: number | null;
  notes: string | null;
  cylinder: {
    id: string;
    internalCode: string;
    serialNumber: string;
    cylinderType: CylinderType;
  };
  saleItem: {
    id: string;
    subtotal: number;
    sale: { id: string; saleNumber: string };
  };
}

export interface Return {
  id: string;
  returnNumber: string;
  customerId: string;
  warehouseId: string;
  returnDate: string;
  status: ReturnStatus;
  totalItems: number;
  notes: string | null;
  customer: Customer;
  warehouse: Warehouse;
  receivedByUser: ReturnUser;
  approvedByUser: ReturnUser | null;
  items: ReturnItem[];
}

export interface CreateReturnInput {
  customerId: string;
  warehouseId: string;
  returnDate: string;
  notes?: string;
}

export interface AddReturnItemInput {
  saleItemId: string;
  conditionAtReturn: ConditionStatus;
  locationId?: string;
  overrideOwnership?: boolean;
  notes?: string;
}

export interface InspectReturnInput {
  items: {
    itemId: string;
    inspectionResult: InspectionResult;
    financialAdjustment?: number;
    notes?: string;
  }[];
}

export function useReturns(filters: { customerId?: string; status?: ReturnStatus } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();

  return useQuery({
    queryKey: ["returns", filters],
    queryFn: () => api.get<Return[]>(`/returns${query ? `?${query}` : ""}`),
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: ["returns", id],
    queryFn: () => api.get<Return>(`/returns/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateReturn(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["returns"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["returns", id] });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReturnInput) => api.post<Return>("/returns", input),
    onSuccess: () => invalidateReturn(queryClient),
  });
}

export function useAddReturnItem(returnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddReturnItemInput) => api.post<ReturnItem>(`/returns/${returnId}/items`, input),
    onSuccess: () => {
      invalidateReturn(queryClient, returnId);
      queryClient.invalidateQueries({ queryKey: ["cylinders"] });
    },
  });
}

export function useRemoveReturnItem(returnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.delete(`/returns/${returnId}/items/${itemId}`),
    onSuccess: () => {
      invalidateReturn(queryClient, returnId);
      queryClient.invalidateQueries({ queryKey: ["cylinders"] });
    },
  });
}

export function useInspectReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: InspectReturnInput & { id: string }) =>
      api.post<Return>(`/returns/${id}/inspect`, input),
    onSuccess: (_data, variables) => {
      invalidateReturn(queryClient, variables.id);
      queryClient.invalidateQueries({ queryKey: ["cylinders"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCompleteReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Return>(`/returns/${id}/complete`),
    onSuccess: (_data, id) => {
      invalidateReturn(queryClient, id);
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
}

export function useCancelReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Return>(`/returns/${id}/cancel`),
    onSuccess: (_data, id) => {
      invalidateReturn(queryClient, id);
      queryClient.invalidateQueries({ queryKey: ["cylinders"] });
    },
  });
}
