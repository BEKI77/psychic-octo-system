"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useDeleteWarehouse, useWarehouses, type Warehouse } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";
import { EditWarehouseDialog } from "./warehouse-dialogs";

export function WarehousesTable() {
  const { data: warehouses, isLoading } = useWarehouses();
  const deleteWarehouse = useDeleteWarehouse();
  const [editing, setEditing] = useState<Warehouse | null>(null);

  async function handleDelete(warehouse: Warehouse) {
    if (!confirm(`Delete warehouse "${warehouse.name}"? Its locations will be deleted too.`)) return;
    try {
      await deleteWarehouse.mutateAsync(warehouse.id);
      toast.success("Warehouse deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete warehouse");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
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
              <TableHead>Address</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses?.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell className="font-medium">
                  <Link href={`/warehouses/${warehouse.id}`} className="hover:underline">
                    {warehouse.code}
                  </Link>
                </TableCell>
                <TableCell>{warehouse.name}</TableCell>
                <TableCell className="text-muted-foreground">{warehouse.address}</TableCell>
                <TableCell className="text-muted-foreground">{warehouse.locations.length}</TableCell>
                <TableCell>
                  <Badge variant={warehouse.isActive ? "default" : "outline"}>
                    {warehouse.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href={`/warehouses/${warehouse.id}`} />}>
                        Manage locations
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditing(warehouse)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(warehouse)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {warehouses?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No warehouses yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditWarehouseDialog warehouse={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  );
}
