import { CreateMaintenanceDialog } from "@/components/maintenance/create-maintenance-dialog";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";

export default function MaintenancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Repairs reported directly or opened from a return inspection (§23).
          </p>
        </div>
        <CreateMaintenanceDialog />
      </div>
      <MaintenanceTable />
    </div>
  );
}
