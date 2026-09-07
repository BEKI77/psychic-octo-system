"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReturns, type ReturnStatus } from "@/hooks/use-returns";

const STATUS_VARIANT: Record<ReturnStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  RECEIVED: "secondary",
  INSPECTED: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
};

export function ReturnsTable() {
  const { data: returns, isLoading } = useReturns();

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
            <TableHead>Return #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns?.map((ret) => (
            <TableRow key={ret.id}>
              <TableCell className="font-medium">
                <Link href={`/returns/${ret.id}`} className="hover:underline">
                  {ret.returnNumber}
                </Link>
              </TableCell>
              <TableCell>{ret.customer.name}</TableCell>
              <TableCell className="text-muted-foreground">{ret.warehouse.code}</TableCell>
              <TableCell className="text-muted-foreground">{ret.returnDate}</TableCell>
              <TableCell className="text-muted-foreground">{ret.totalItems}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[ret.status]}>{ret.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {returns?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No returns yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
