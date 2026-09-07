"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomerLedger } from "@/hooks/use-customers";

export function LedgerTable({ customerId }: { customerId: string }) {
  const { data: entries, isLoading } = useCustomerLedger(customerId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries?.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground">
                {new Date(entry.transactionDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{entry.transactionType.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{entry.notes ?? "—"}</TableCell>
              <TableCell className="tabular-nums">{entry.debit > 0 ? entry.debit : "—"}</TableCell>
              <TableCell className="tabular-nums">{entry.credit > 0 ? entry.credit : "—"}</TableCell>
              <TableCell className="font-medium tabular-nums">{entry.balance}</TableCell>
            </TableRow>
          ))}
          {entries?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No ledger activity yet — entries appear here for sales, payments and returns confirmed
                after Phase 6 shipped.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
