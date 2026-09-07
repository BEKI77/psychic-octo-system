"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLogs, type AuditLog } from "@/hooks/use-audit-logs";

/** §45 Audit Logging — read-only browser over the append-only audit_logs table. */
export function AuditLogsTable() {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const { data: logs, isLoading } = useAuditLogs({
    entityType: entityType || undefined,
    entityId: entityId || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
    limit: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Entity type" value={entityType} onChange={setEntityType} placeholder="e.g. cylinders" />
        <Field label="Entity ID" value={entityId} onChange={setEntityId} placeholder="uuid" />
        <Field label="Action" value={action} onChange={setAction} placeholder="e.g. CREATE" />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.entityType}
                    {log.entityId && <span className="ml-1 font-mono text-xs">{log.entityId.slice(0, 8)}</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDetail(log)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No audit log entries match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detail?.action} · {detail?.entityType}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>User</span>
                <span className="text-foreground">
                  {detail.user ? `${detail.user.firstName} ${detail.user.lastName}` : "System"}
                </span>
                <span>When</span>
                <span className="text-foreground">{new Date(detail.createdAt).toLocaleString()}</span>
                <span>IP address</span>
                <span className="text-foreground">{detail.ipAddress ?? "—"}</span>
                <span>User agent</span>
                <span className="truncate text-foreground">{detail.userAgent ?? "—"}</span>
              </div>
              {detail.oldValues != null && (
                <div>
                  <p className="mb-1 font-medium">Old values</p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(detail.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              {detail.newValues != null && (
                <div>
                  <p className="mb-1 font-medium">New values</p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(detail.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-44"
      />
    </div>
  );
}
