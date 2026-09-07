"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSales, type Sale } from "@/hooks/use-sales";

const STATUS_VARIANT: Record<Sale["status"], "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  CONFIRMED: "default",
  CANCELLED: "outline",
};

const PAYMENT_VARIANT: Record<Sale["paymentStatus"], "default" | "secondary" | "outline" | "destructive"> = {
  UNPAID: "destructive",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  OVERPAID: "secondary",
};

export function SalesTable() {
  const { data: sales, isLoading } = useSales();

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
            <TableHead>Sale #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales?.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">
                <Link href={`/sales/${sale.id}`} className="hover:underline">
                  {sale.saleNumber}
                </Link>
              </TableCell>
              <TableCell>{sale.customer.name}</TableCell>
              <TableCell className="text-muted-foreground">{sale.saleDate}</TableCell>
              <TableCell className="tabular-nums">{sale.total}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{sale.outstandingAmount}</TableCell>
              <TableCell>
                <Badge variant={PAYMENT_VARIANT[sale.paymentStatus]}>{sale.paymentStatus.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[sale.status]}>{sale.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {sales?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No sales yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
