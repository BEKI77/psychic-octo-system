"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRemoveReturnItem, type Return } from "@/hooks/use-returns";
import { ApiError } from "@/lib/api";

const RESULT_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  GOOD: "default",
  DAMAGED: "destructive",
  NEEDS_REPAIR: "secondary",
};

export function ReturnItemsTable({ ret }: { ret: Return }) {
  const removeItem = useRemoveReturnItem(ret.id);
  const canRemove = ret.status === "RECEIVED";
  const showResults = ret.status === "INSPECTED" || ret.status === "COMPLETED";

  async function handleRemove(itemId: string) {
    try {
      await removeItem.mutateAsync(itemId);
      toast.success("Item removed — cylinder restored to customer");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove item");
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cylinder</TableHead>
            <TableHead>From sale</TableHead>
            <TableHead>Reported condition</TableHead>
            {showResults && <TableHead>Inspection result</TableHead>}
            {showResults && <TableHead>Financial adjustment</TableHead>}
            {canRemove && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ret.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.cylinder.internalCode}</TableCell>
              <TableCell className="text-muted-foreground">{item.saleItem.sale.saleNumber}</TableCell>
              <TableCell className="text-muted-foreground">{item.conditionAtReturn.replace("_", " ")}</TableCell>
              {showResults && (
                <TableCell>
                  {item.inspectionResult && (
                    <Badge variant={RESULT_VARIANT[item.inspectionResult]}>
                      {item.inspectionResult.replace("_", " ")}
                    </Badge>
                  )}
                </TableCell>
              )}
              {showResults && <TableCell className="tabular-nums">{item.financialAdjustment ?? "—"}</TableCell>}
              {canRemove && (
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {ret.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No cylinders received yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
