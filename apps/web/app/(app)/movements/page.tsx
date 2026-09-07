import { MovementsTable } from "@/components/inventory/movements-table";

export default function MovementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movements</h1>
        <p className="text-sm text-muted-foreground">
          The full inventory transaction audit trail (§12) — nothing here is ever edited or deleted.
        </p>
      </div>
      <MovementsTable />
    </div>
  );
}
