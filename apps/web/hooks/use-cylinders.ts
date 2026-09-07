import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CylinderType } from "./use-cylinder-types";
import type { Customer } from "./use-customers";
import type { Location, Warehouse } from "./use-warehouses";

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "WITH_CUSTOMER",
  "IN_TRANSIT",
  "BLOCKED",
  "SCRAPPED",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const CONDITION_STATUSES = [
  "GOOD",
  "DAMAGED",
  "NEEDS_INSPECTION",
  "UNDER_REPAIR",
  "REPAIRED",
  "SCRAPPED",
] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export interface Cylinder {
  id: string;
  cylinderTypeId: string;
  internalCode: string;
  serialNumber: string;
  qrCode: string | null;
  barcode: string | null;
  manufactureDate: string | null;
  purchaseDate: string | null;
  availabilityStatus: AvailabilityStatus;
  conditionStatus: ConditionStatus;
  currentWarehouseId: string | null;
  currentLocationId: string | null;
  currentCustomerId: string | null;
  cylinderType: CylinderType;
  currentWarehouse: Warehouse | null;
  currentLocation: Location | null;
  currentCustomer: Customer | null;
}

export interface CylinderFilters {
  status?: AvailabilityStatus;
  condition?: ConditionStatus;
  type?: string;
  warehouse?: string;
  location?: string;
  search?: string;
}

export interface CylinderInput {
  cylinderTypeId?: string;
  internalCode?: string;
  serialNumber?: string;
  qrCode?: string;
  barcode?: string;
  currentWarehouseId?: string;
  currentLocationId?: string;
  availabilityStatus?: AvailabilityStatus;
  conditionStatus?: ConditionStatus;
}

export function useCylinders(filters: CylinderFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();

  return useQuery({
    queryKey: ["cylinders", filters],
    queryFn: () => api.get<Cylinder[]>(`/cylinders${query ? `?${query}` : ""}`),
  });
}

export function useCreateCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CylinderInput) => api.post<Cylinder>("/cylinders", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cylinders"] }),
  });
}

export function useUpdateCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CylinderInput & { id: string }) =>
      api.patch<Cylinder>(`/cylinders/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cylinders"] }),
  });
}

/**
 * §7 Universal Scan Experience — on-demand lookup by whatever code the
 * scanner (or manual entry) produced. A mutation rather than a query since
 * it's fired imperatively per scan, not derived from render state.
 */
export function useLookupCylinder() {
  return useMutation({
    mutationFn: (code: string) => api.get<Cylinder>(`/cylinders/lookup/${encodeURIComponent(code)}`),
  });
}

export function useDeleteCylinder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cylinders/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cylinders"] }),
  });
}
