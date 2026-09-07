import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMe } from "./use-me";

export const LOCATION_TYPES = [
  "ZONE",
  "RACK",
  "AREA",
  "REPAIR",
  "INSPECTION",
  "DISPATCH",
  "SCRAP",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export interface Location {
  id: string;
  warehouseId: string;
  parentId: string | null;
  code: string;
  name: string;
  locationType: LocationType;
  isActive: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  locations: Location[];
}

export interface WarehouseInput {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
}

export interface LocationInput {
  code?: string;
  name?: string;
  locationType?: LocationType;
  parentId?: string | null;
}

export function useWarehouses() {
  return useQuery({ queryKey: ["warehouses"], queryFn: () => api.get<Warehouse[]>("/warehouses") });
}

/**
 * §66 Phase 8 Multiple Warehouses — the warehouses the current user may
 * transact at. Falls back to every warehouse when they have no assignment
 * rows (opt-in scoping, matching the backend's WarehouseAccessService).
 */
export function useAssignedWarehouses() {
  const warehousesQuery = useWarehouses();
  const { data: me } = useMe();

  const assigned = me?.assignedWarehouseIds;
  const data =
    assigned && assigned.length > 0
      ? warehousesQuery.data?.filter((w) => assigned.includes(w.id))
      : warehousesQuery.data;

  return { ...warehousesQuery, data };
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => api.get<Warehouse>(`/warehouses/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WarehouseInput) => api.post<Warehouse>("/warehouses", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: WarehouseInput & { id: string }) =>
      api.patch<Warehouse>(`/warehouses/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/warehouses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses"] }),
  });
}

export function useCreateLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LocationInput) => api.post<Location>(`/warehouses/${warehouseId}/locations`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses", warehouseId] }),
  });
}

export function useUpdateLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: LocationInput & { id: string }) =>
      api.patch<Location>(`/locations/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses", warehouseId] }),
  });
}

export function useDeleteLocation(warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouses", warehouseId] }),
  });
}
