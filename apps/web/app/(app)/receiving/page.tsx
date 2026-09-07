import { CreateReceiptDialog } from "@/components/receiving/create-receipt-dialog";
import { ReceiptsTable } from "@/components/receiving/receipts-table";

export default function ReceivingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Receiving</h1>
          <p className="text-sm text-muted-foreground">
            Log cylinders arriving from suppliers (§11).
          </p>
        </div>
        <CreateReceiptDialog />
      </div>
      <ReceiptsTable />
    </div>
  );
}
