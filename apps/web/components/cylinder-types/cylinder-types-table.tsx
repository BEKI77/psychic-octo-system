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
import { useCylinderTypes, useDeleteCylinderType, type CylinderType } from "@/hooks/use-cylinder-types";
import { ApiError } from "@/lib/api";
import { EditCylinderTypeDialog } from "./cylinder-type-dialogs";

export function CylinderTypesTable() {
  const { data: types, isLoading } = useCylinderTypes();
  const deleteType = useDeleteCylinderType();
  const [editing, setEditing] = useState<CylinderType | null>(null);

  async function handleDelete(type: CylinderType) {
    if (!confirm(`Delete cylinder type "${type.name}"?`)) return;
    try {
      await deleteType.mutateAsync(type.id);
      toast.success("Cylinder type deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete cylinder type");
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
              <TableHead>Capacity</TableHead>
              <TableHead>Deposit</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {types?.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.code}</TableCell>
                <TableCell>{type.name}</TableCell>
                <TableCell className="text-muted-foreground">{type.capacityKg} kg</TableCell>
                <TableCell className="text-muted-foreground">{type.depositAmount ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{type.defaultPrice ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={type.isActive ? "default" : "outline"}>
                    {type.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(type)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(type)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {types?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No cylinder types yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditCylinderTypeDialog cylinderType={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  );
}
