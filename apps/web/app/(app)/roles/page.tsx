import { CreateRoleDialog } from "@/components/roles/create-role-dialog";
import { RolesTable } from "@/components/roles/roles-table";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage RBAC roles and which permissions they grant.
          </p>
        </div>
        <CreateRoleDialog />
      </div>
      <RolesTable />
    </div>
  );
}
