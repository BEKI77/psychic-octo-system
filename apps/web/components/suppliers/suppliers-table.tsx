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
import { useDeleteSupplier, useSuppliers, type Supplier } from "@/hooks/use-suppliers";
import { ApiError } from "@/lib/api";
import { EditSupplierDialog } from "./supplier-dialogs";

export function SuppliersTable() {
  const { data: suppliers, isLoading } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();
  const [editing, setEditing] = useState<Supplier | null>(null);

  async function handleDelete(supplier: Supplier) {
    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await deleteSupplier.mutateAsync(supplier.id);
      toast.success("Supplier deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete supplier");
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers?.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.code}</TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.contactPerson}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                <TableCell>
                  <Badge variant={supplier.isActive ? "default" : "outline"}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(supplier)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(supplier)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {suppliers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No suppliers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditSupplierDialog supplier={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  );
}
