"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventoryReport } from "@/hooks/use-reports";

/** §50 Core Reports — Inventory Report: Cylinder Type | Total | Available | Customer | Repair | Damaged. */
export function InventoryReport() {
  const { data, isLoading } = useInventoryReport();

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const totals = (data ?? []).reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      available: acc.available + row.available,
      customer: acc.customer + row.customer,
      repair: acc.repair + row.repair,
      damaged: acc.damaged + row.damaged,
    }),
    { total: 0, available: 0, customer: 0, repair: 0, damaged: 0 },
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cylinder Type</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Customer</TableHead>
            <TableHead className="text-right">Repair</TableHead>
            <TableHead className="text-right">Damaged</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((row) => (
            <TableRow key={row.cylinderTypeId}>
              <TableCell className="font-medium">
                {row.cylinderTypeName}
                <span className="ml-2 text-xs text-muted-foreground">{row.cylinderTypeCode}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.total}</TableCell>
              <TableCell className="text-right tabular-nums">{row.available}</TableCell>
              <TableCell className="text-right tabular-nums">{row.customer}</TableCell>
              <TableCell className="text-right tabular-nums">{row.repair}</TableCell>
              <TableCell className="text-right tabular-nums">{row.damaged}</TableCell>
            </TableRow>
          ))}
          {data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No cylinder types registered.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {data && data.length > 0 && (
          <tfoot>
            <TableRow className="font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">{totals.total}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.available}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.customer}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.repair}</TableCell>
              <TableCell className="text-right tabular-nums">{totals.damaged}</TableCell>
            </TableRow>
          </tfoot>
        )}
      </Table>
    </div>
  );
}
