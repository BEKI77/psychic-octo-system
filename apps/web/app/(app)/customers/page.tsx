import { CreateCustomerDialog } from "@/components/customers/customer-dialogs";
import { CustomersTable } from "@/components/customers/customers-table";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Accounts, holdings and credit (§13, §40).</p>
        </div>
        <CreateCustomerDialog />
      </div>
      <CustomersTable />
    </div>
  );
}
