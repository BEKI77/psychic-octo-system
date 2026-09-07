"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddReturnItemDialog } from "@/components/returns/add-return-item-dialog";
import { InspectReturnDialog } from "@/components/returns/inspect-return-dialog";
import { ReturnItemsTable } from "@/components/returns/return-items-table";
import { useCancelReturn, useCompleteReturn, useReturn, type ReturnStatus } from "@/hooks/use-returns";
import { ApiError } from "@/lib/api";

const STATUS_VARIANT: Record<ReturnStatus, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  RECEIVED: "secondary",
  INSPECTED: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
};

export default function ReturnDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: ret, isLoading } = useReturn(params.id);
  const cancelReturn = useCancelReturn();
  const completeReturn = useCompleteReturn();

  async function handleCancel() {
    if (!ret) return;
    if (!confirm(`Cancel return ${ret.returnNumber}? Any received cylinders go back to the customer.`)) return;
    try {
      await cancelReturn.mutateAsync(ret.id);
      toast.success("Return cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel return");
    }
  }

  async function handleComplete() {
    if (!ret) return;
    try {
      await completeReturn.mutateAsync(ret.id);
      toast.success("Return completed — sale balances updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to complete return");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/returns"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Returns
        </Link>
      </div>

      {isLoading || !ret ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{ret.returnNumber}</h1>
                <Badge variant={STATUS_VARIANT[ret.status]}>{ret.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Link href={`/customers/${ret.customerId}`} className="hover:underline">
                  {ret.customer.name}
                </Link>{" "}
                · {ret.warehouse.code} · {ret.returnDate}
              </p>
            </div>

            <div className="flex gap-2">
              {(ret.status === "DRAFT" || ret.status === "RECEIVED") && (
                <Button variant="outline" onClick={handleCancel} disabled={cancelReturn.isPending}>
                  <Ban className="size-4" />
                  Cancel
                </Button>
              )}
              {ret.status === "RECEIVED" && <InspectReturnDialog ret={ret} />}
              {ret.status === "INSPECTED" && (
                <Button onClick={handleComplete} disabled={completeReturn.isPending}>
                  <CheckCircle2 className="size-4" />
                  {completeReturn.isPending ? "Completing..." : "Complete return"}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Cylinders ({ret.items.length})</h2>
            {(ret.status === "DRAFT" || ret.status === "RECEIVED") && <AddReturnItemDialog ret={ret} />}
          </div>
          <ReturnItemsTable ret={ret} />
        </>
      )}
    </div>
  );
}
