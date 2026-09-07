import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  rolePermissions: { permission: Permission }[];
}

export interface RoleInput {
  name: string;
  description?: string;
  permissionIds: string[];
}

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/roles") });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get<Permission[]>("/permissions"),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoleInput) => api.post<Role>("/roles", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<RoleInput> & { id: string }) =>
      api.patch<Role>(`/roles/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}
