"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCylinders, useDeleteCylinder, type Cylinder, type CylinderFilters } from "@/hooks/use-cylinders";
import { ApiError } from "@/lib/api";
import { AdjustDialog } from "./adjust-dialog";
import { EditCylinderDialog } from "./edit-cylinder-dialog";
import { AvailabilityBadge, ConditionBadge } from "./status-badges";
import { TransferDialog } from "./transfer-dialog";

export function CylindersTable({ filters }: { filters: CylinderFilters }) {
  const { data: cylinders, isLoading } = useCylinders(filters);
  const deleteCylinder = useDeleteCylinder();
  const [editing, setEditing] = useState<Cylinder | null>(null);
  const [transferring, setTransferring] = useState<Cylinder | null>(null);
  const [adjusting, setAdjusting] = useState<Cylinder | null>(null);

  async function handleDelete(cylinder: Cylinder) {
    if (!confirm(`Delete cylinder "${cylinder.internalCode}"?`)) return;
    try {
      await deleteCylinder.mutateAsync(cylinder.id);
      toast.success("Cylinder deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete cylinder");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {cylinders?.map((cylinder) => (
          <div key={cylinder.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{cylinder.internalCode}</p>
                <p className="mt-1 text-xs text-muted-foreground">{cylinder.serialNumber} · {cylinder.cylinderType.code}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}><MoreHorizontal className="size-4" /></DropdownMenuTrigger>
                <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setEditing(cylinder)}>Edit</DropdownMenuItem><DropdownMenuItem onClick={() => setTransferring(cylinder)}>Transfer</DropdownMenuItem><DropdownMenuItem onClick={() => setAdjusting(cylinder)}>Adjust</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => handleDelete(cylinder)}>Delete</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">{cylinder.currentWarehouse ? `${cylinder.currentWarehouse.code}${cylinder.currentLocation ? ` / ${cylinder.currentLocation.code}` : ""}` : "No location"}</span>
              <div className="flex gap-1.5"><AvailabilityBadge status={cylinder.availabilityStatus} /><ConditionBadge status={cylinder.conditionStatus} /></div>
            </div>
          </div>
        ))}
        {cylinders?.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No cylinders match these filters.</p>}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Internal code</TableHead>
              <TableHead>Serial number</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cylinders?.map((cylinder) => (
              <TableRow key={cylinder.id}>
                <TableCell className="font-medium">{cylinder.internalCode}</TableCell>
                <TableCell className="text-muted-foreground">{cylinder.serialNumber}</TableCell>
                <TableCell>{cylinder.cylinderType.code}</TableCell>
                <TableCell className="text-muted-foreground">
                  {cylinder.currentWarehouse
                    ? `${cylinder.currentWarehouse.code}${cylinder.currentLocation ? ` / ${cylinder.currentLocation.code}` : ""}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <AvailabilityBadge status={cylinder.availabilityStatus} />
                </TableCell>
                <TableCell>
                  <ConditionBadge status={cylinder.conditionStatus} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(cylinder)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTransferring(cylinder)}>Transfer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAdjusting(cylinder)}>Adjust</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(cylinder)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {cylinders?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No cylinders match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditCylinderDialog cylinder={editing} onOpenChange={(open) => !open && setEditing(null)} />
      <TransferDialog cylinder={transferring} onOpenChange={(open) => !open && setTransferring(null)} />
      <AdjustDialog cylinder={adjusting} onOpenChange={(open) => !open && setAdjusting(null)} />
    </>
  );
}
