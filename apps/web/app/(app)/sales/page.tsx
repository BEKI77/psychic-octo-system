import { CreateSaleDialog } from "@/components/sales/create-sale-dialog";
import { SalesTable } from "@/components/sales/sales-table";

export default function SalesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">Cylinder issues to customers (§15).</p>
        </div>
        <CreateSaleDialog />
      </div>
      <SalesTable />
    </div>
  );
}
