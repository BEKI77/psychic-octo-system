"use client";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRemoveSaleItem, type Sale } from "@/hooks/use-sales";
import { ApiError } from "@/lib/api";

export function SaleItemsTable({ sale }: { sale: Sale }) {
  const removeItem = useRemoveSaleItem(sale.id);
  const editable = sale.status === "DRAFT";

  async function handleRemove(itemId: string) {
    try {
      await removeItem.mutateAsync(itemId);
      toast.success("Item removed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove item");
    }
  }

  const subtotal = sale.items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Internal code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Subtotal</TableHead>
              {editable && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.cylinder.internalCode}</TableCell>
                <TableCell>{item.cylinder.cylinderType.code}</TableCell>
                <TableCell className="tabular-nums">{item.unitPrice}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{item.discount}</TableCell>
                <TableCell className="tabular-nums">{item.subtotal}</TableCell>
                {editable && (
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {sale.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={editable ? 6 : 5} className="text-center text-muted-foreground">
                  No cylinders added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {sale.items.length > 0 && (
        <p className="text-right text-sm text-muted-foreground">
          Subtotal: <span className="font-medium text-foreground">{subtotal}</span>
        </p>
      )}
    </div>
  );
}
