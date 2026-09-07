"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreditAgingReport } from "@/hooks/use-reports";

export function CreditAgingTable() {
  const { data: rows, isLoading } = useCreditAgingReport();

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const totals = (rows ?? []).reduce(
    (acc, r) => ({
      bucket0to30: acc.bucket0to30 + r.bucket0to30,
      bucket31to60: acc.bucket31to60 + r.bucket31to60,
      bucket61to90: acc.bucket61to90 + r.bucket61to90,
      bucket90plus: acc.bucket90plus + r.bucket90plus,
      total: acc.total + r.total,
    }),
    { bucket0to30: 0, bucket31to60: 0, bucket61to90: 0, bucket90plus: 0, total: 0 },
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">0–30 days</TableHead>
            <TableHead className="text-right">31–60 days</TableHead>
            <TableHead className="text-right">61–90 days</TableHead>
            <TableHead className="text-right">90+ days</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows?.map((row) => (
            <TableRow key={row.customerId}>
              <TableCell className="font-medium">{row.customerName}</TableCell>
              <TableCell className="text-right tabular-nums">{row.bucket0to30 || "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{row.bucket31to60 || "—"}</TableCell>
              <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-500">
                {row.bucket61to90 || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-destructive">
                {row.bucket90plus || "—"}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{row.total}</TableCell>
            </TableRow>
          ))}
          {rows?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No outstanding balances.
              </TableCell>
            </TableRow>
          )}
          {rows && rows.length > 0 && (
            <TableRow className="font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">{totals.bucket0to30}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.bucket31to60}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.bucket61to90}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.bucket90plus}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.total}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
