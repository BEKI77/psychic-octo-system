import { CreateWarehouseDialog } from "@/components/warehouses/warehouse-dialogs";
import { WarehousesTable } from "@/components/warehouses/warehouses-table";

export default function WarehousesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
          <p className="text-sm text-muted-foreground">Sites and their storage locations (§7).</p>
        </div>
        <CreateWarehouseDialog />
      </div>
      <WarehousesTable />
    </div>
  );
}
