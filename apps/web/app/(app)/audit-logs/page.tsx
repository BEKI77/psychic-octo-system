import { AuditLogsTable } from "@/components/audit-logs/audit-logs-table";

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Every mutating action across the system, append-only and never edited (§45).
        </p>
      </div>
      <AuditLogsTable />
    </div>
  );
}
