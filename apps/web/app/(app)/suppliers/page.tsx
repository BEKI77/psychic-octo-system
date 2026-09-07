import { CreateSupplierDialog } from "@/components/suppliers/supplier-dialogs";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";

export default function SuppliersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Vendors cylinders are received from.</p>
        </div>
        <CreateSupplierDialog />
      </div>
      <SuppliersTable />
    </div>
  );
}
