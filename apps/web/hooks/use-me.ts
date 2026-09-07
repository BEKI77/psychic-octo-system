import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PermissionCode } from "@/lib/permissions";

export interface MeResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
  };
  permissions: PermissionCode[];
  /** §66 Phase 8 Multiple Warehouses — empty means unrestricted (every warehouse). */
  assignedWarehouseIds: string[];
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<MeResponse>("/auth/me"),
    retry: false,
  });
}

export function useHasPermission(code: PermissionCode) {
  const { data } = useMe();
  return data?.permissions.includes(code) ?? false;
}
