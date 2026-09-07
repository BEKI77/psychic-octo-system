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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteLocation, type Location } from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";
import { EditLocationDialog } from "./location-dialogs";

export function LocationsTable({
  warehouseId,
  locations,
}: {
  warehouseId: string;
  locations: Location[];
}) {
  const deleteLocation = useDeleteLocation(warehouseId);
  const [editing, setEditing] = useState<Location | null>(null);

  const byId = new Map(locations.map((l) => [l.id, l]));

  async function handleDelete(location: Location) {
    if (!confirm(`Delete location "${location.code}"?`)) return;
    try {
      await deleteLocation.mutateAsync(location.id);
      toast.success("Location deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete location");
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.code}</TableCell>
                <TableCell>{location.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{location.locationType}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {location.parentId ? (byId.get(location.parentId)?.code ?? "—") : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={location.isActive ? "default" : "outline"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(location)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(location)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No locations yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditLocationDialog
        warehouseId={warehouseId}
        location={editing}
        locations={locations}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  );
}
