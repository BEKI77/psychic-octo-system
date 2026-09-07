import { CreditAgingTable } from "@/components/reports/credit-aging-table";

export default function CreditAgingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Credit Aging</h1>
        <p className="text-sm text-muted-foreground">
          Outstanding balances by how long they&apos;ve been owed (§50).
        </p>
      </div>
      <CreditAgingTable />
    </div>
  );
}
