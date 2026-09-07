"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConditionBadge } from "@/components/cylinders/status-badges";
import { useRemoveReceiptItem, type Receipt } from "@/hooks/use-receiving";
import { ApiError } from "@/lib/api";

export function ReceiptItemsTable({ receipt }: { receipt: Receipt }) {
  const removeItem = useRemoveReceiptItem(receipt.id);
  const editable = receipt.status === "DRAFT";

  async function handleRemove(itemId: string) {
    try {
      await removeItem.mutateAsync(itemId);
      toast.success("Item removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove item");
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Internal code</TableHead>
            <TableHead>Serial number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Condition</TableHead>
            {editable && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipt.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.cylinder.internalCode}</TableCell>
              <TableCell className="text-muted-foreground">{item.cylinder.serialNumber}</TableCell>
              <TableCell>{item.cylinder.cylinderType.code}</TableCell>
              <TableCell className="text-muted-foreground">{item.location?.code ?? "—"}</TableCell>
              <TableCell>
                <ConditionBadge status={item.conditionStatus} />
              </TableCell>
              {editable && (
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {receipt.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={editable ? 6 : 5} className="text-center text-muted-foreground">
                No cylinders added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
