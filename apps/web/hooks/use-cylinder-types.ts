import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CylinderType {
  id: string;
  code: string;
  name: string;
  capacityKg: number;
  brand: string | null;
  description: string | null;
  depositAmount: number | null;
  defaultPrice: number | null;
  isActive: boolean;
}

export interface CylinderTypeInput {
  code?: string;
  name?: string;
  capacityKg?: number;
  brand?: string;
  description?: string;
  depositAmount?: number;
  defaultPrice?: number;
}

export function useCylinderTypes() {
  return useQuery({
    queryKey: ["cylinder-types"],
    queryFn: () => api.get<CylinderType[]>("/cylinder-types"),
  });
}

export function useCreateCylinderType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CylinderTypeInput) => api.post<CylinderType>("/cylinder-types", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cylinder-types"] }),
  });
}

export function useUpdateCylinderType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CylinderTypeInput & { id: string }) =>
      api.patch<CylinderType>(`/cylinder-types/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cylinder-types"] }),
  });
}

export function useDeleteCylinderType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cylinder-types/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cylinder-types"] }),
  });
}
