import { CreatePaymentDialog } from "@/components/payments/create-payment-dialog";
import { PaymentsTable } from "@/components/payments/payments-table";

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Cash collected from customers (§17) — allocate across invoices (§18) or void.
          </p>
        </div>
        <CreatePaymentDialog />
      </div>
      <PaymentsTable />
    </div>
  );
}
