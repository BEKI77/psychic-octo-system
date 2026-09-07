"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePayments, useVoidPayment, type Payment } from "@/hooks/use-payments";
import { ApiError } from "@/lib/api";
import { AllocatePaymentDialog } from "./allocate-payment-dialog";

export function PaymentsTable() {
  const { data: payments, isLoading } = usePayments();
  const voidPayment = useVoidPayment();
  const [allocating, setAllocating] = useState<Payment | null>(null);

  async function handleVoid(id: string, paymentNumber: string) {
    if (!confirm(`Void payment ${paymentNumber}? This reverses it against the sale(s) it paid down.`)) return;
    try {
      await voidPayment.mutateAsync(id);
      toast.success("Payment voided");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to void payment");
    }
  }

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
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Unallocated</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Sale(s)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                <TableCell>{payment.customer.name}</TableCell>
                <TableCell className="tabular-nums">{payment.amount}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {payment.status === "COMPLETED" ? payment.unallocatedAmount : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{payment.paymentMethod.replace("_", " ")}</TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.allocations.map((a) => a.sale.saleNumber).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{payment.paymentDate}</TableCell>
                <TableCell>
                  <Badge variant={payment.status === "COMPLETED" ? "default" : "outline"}>{payment.status}</Badge>
                </TableCell>
                <TableCell>
                  {payment.status === "COMPLETED" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.unallocatedAmount > 0 && (
                          <DropdownMenuItem onClick={() => setAllocating(payment)}>Allocate</DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleVoid(payment.id, payment.paymentNumber)}
                        >
                          Void
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {payments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No payments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AllocatePaymentDialog payment={allocating} onOpenChange={(open) => !open && setAllocating(null)} />
    </>
  );
}
