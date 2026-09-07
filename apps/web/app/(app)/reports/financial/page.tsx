import { FinancialSummary } from "@/components/reports/financial-summary";

export default function FinancialReportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financial Summary</h1>
        <p className="text-sm text-muted-foreground">Sales, collections and outstanding balances (§34).</p>
      </div>
      <FinancialSummary />
    </div>
  );
}
