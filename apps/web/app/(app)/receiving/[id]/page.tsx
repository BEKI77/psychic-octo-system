"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddItemDialog } from "@/components/receiving/add-item-dialog";
import { ReceiptItemsTable } from "@/components/receiving/receipt-items-table";
import { useCancelReceipt, useConfirmReceipt, useReceipt, type ReceiptStatus } from "@/hooks/use-receiving";
import { ApiError } from "@/lib/api";

const STATUS_VARIANT: Record<ReceiptStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "secondary",
  RECEIVED: "default",
  CANCELLED: "outline",
};

export default function ReceiptDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: receipt, isLoading } = useReceipt(params.id);
  const confirmReceipt = useConfirmReceipt();
  const cancelReceipt = useCancelReceipt();

  async function handleConfirm() {
    if (!receipt) return;
    if (!confirm(`Confirm receipt ${receipt.receiptNumber}? This moves ${receipt.items.length} cylinder(s) into ${receipt.warehouse.code} and cannot be undone.`)) {
      return;
    }
    try {
      await confirmReceipt.mutateAsync(receipt.id);
      toast.success("Receipt confirmed — cylinders received into stock");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to confirm receipt");
    }
  }

  async function handleCancel() {
    if (!receipt) return;
    if (!confirm(`Cancel receipt ${receipt.receiptNumber}?`)) return;
    try {
      await cancelReceipt.mutateAsync(receipt.id);
      toast.success("Receipt cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel receipt");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/receiving"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Receiving
        </Link>
      </div>

      {isLoading || !receipt ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{receipt.receiptNumber}</h1>
                <Badge variant={STATUS_VARIANT[receipt.status]}>{receipt.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {receipt.supplier.name} → {receipt.warehouse.name} · {receipt.receivedDate}
              </p>
            </div>

            {receipt.status === "DRAFT" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={cancelReceipt.isPending}>
                  <Ban className="size-4" />
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={confirmReceipt.isPending || receipt.items.length === 0}>
                  <CheckCircle2 className="size-4" />
                  {confirmReceipt.isPending ? "Confirming..." : "Confirm receipt"}
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm sm:grid-cols-4">
              <div>
                <span className="block text-muted-foreground">Supplier ref.</span>
                {receipt.supplierReference ?? "—"}
              </div>
              <div>
                <span className="block text-muted-foreground">Created by</span>
                {receipt.createdByUser.firstName} {receipt.createdByUser.lastName}
              </div>
              <div>
                <span className="block text-muted-foreground">Confirmed by</span>
                {receipt.approvedByUser
                  ? `${receipt.approvedByUser.firstName} ${receipt.approvedByUser.lastName}`
                  : "—"}
              </div>
              <div>
                <span className="block text-muted-foreground">Notes</span>
                {receipt.notes ?? "—"}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Cylinders ({receipt.items.length})</h2>
            {receipt.status === "DRAFT" && <AddItemDialog receipt={receipt} />}
          </div>
          <ReceiptItemsTable receipt={receipt} />
        </>
      )}
    </div>
  );
}
