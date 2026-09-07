"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReceipts, type ReceiptStatus } from "@/hooks/use-receiving";

const STATUS_VARIANT: Record<ReceiptStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "secondary",
  RECEIVED: "default",
  CANCELLED: "outline",
};

export function ReceiptsTable() {
  const { data: receipts, isLoading } = useReceipts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts?.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="font-medium">
                <Link href={`/receiving/${receipt.id}`} className="hover:underline">
                  {receipt.receiptNumber}
                </Link>
              </TableCell>
              <TableCell>{receipt.supplier.name}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.warehouse.code}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.receivedDate}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.items.length}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[receipt.status]}>{receipt.status.replace("_", " ")}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {receipts?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No receipts yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
