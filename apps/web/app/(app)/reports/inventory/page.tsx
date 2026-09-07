import { InventoryReport } from "@/components/reports/inventory-report";

export default function InventoryReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory Report</h1>
        <p className="text-sm text-muted-foreground">
          Cylinder counts by type: total, available, with customers, in repair, damaged (§50).
        </p>
      </div>
      <InventoryReport />
    </div>
  );
}
