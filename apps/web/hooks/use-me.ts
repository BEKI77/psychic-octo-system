import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PermissionCode } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { FRONTEND_TEST_MODE } from "@/lib/frontend-test-mode";

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
    queryKey: ["me", FRONTEND_TEST_MODE],
    queryFn: () => FRONTEND_TEST_MODE
      ? Promise.resolve<MeResponse>({
          user: { id: "frontend-test-user", username: "admin", email: "admin@cylinder.local", firstName: "Frontend", lastName: "Tester", phone: null, isActive: true },
          permissions: [...PERMISSIONS],
          assignedWarehouseIds: [],
        })
      : api.get<MeResponse>("/auth/me"),
    retry: false,
  });
}

export function useHasPermission(code: PermissionCode) {
  const { data } = useMe();
  return data?.permissions.includes(code) ?? false;
}
