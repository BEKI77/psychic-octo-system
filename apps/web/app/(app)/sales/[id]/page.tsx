"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddSaleItemDialog } from "@/components/sales/add-sale-item-dialog";
import { ConfirmSaleDialog } from "@/components/sales/confirm-sale-dialog";
import { SaleItemsTable } from "@/components/sales/sale-items-table";
import { useCancelSale, useSale, type SaleStatus } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

const STATUS_VARIANT: Record<SaleStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  CONFIRMED: "default",
  CANCELLED: "outline",
};

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: sale, isLoading } = useSale(params.id);
  const cancelSale = useCancelSale();

  async function handleCancel() {
    if (!sale) return;
    if (!confirm(`Cancel draft sale ${sale.saleNumber}?`)) return;
    try {
      await cancelSale.mutateAsync(sale.id);
      toast.success("Sale cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel sale");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/sales"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Sales
        </Link>
      </div>

      {isLoading || !sale ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{sale.saleNumber}</h1>
                <Badge variant={STATUS_VARIANT[sale.status]}>{sale.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Link href={`/customers/${sale.customerId}`} className="hover:underline">
                  {sale.customer.name}
                </Link>{" "}
                · {sale.warehouse.code} · {sale.saleDate}
              </p>
            </div>

            {sale.status === "DRAFT" && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={cancelSale.isPending}>
                  <Ban className="size-4" />
                  Cancel
                </Button>
                <ConfirmSaleDialog sale={sale} />
              </div>
            )}
          </div>

          {sale.status === "CONFIRMED" && (
            <Card>
              <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm sm:grid-cols-4">
                <div>
                  <span className="block text-muted-foreground">Total</span>
                  <span className="tabular-nums font-medium">{sale.total}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Paid</span>
                  <span className="tabular-nums font-medium">{sale.paidAmount}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Outstanding</span>
                  <span className="tabular-nums font-medium">{sale.outstandingAmount}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Payment status</span>
                  <Badge variant="secondary">{sale.paymentStatus.replace("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Cylinders ({sale.items.length})</h2>
            {sale.status === "DRAFT" && <AddSaleItemDialog sale={sale} />}
          </div>
          <SaleItemsTable sale={sale} />
        </>
      )}
    </div>
  );
}
