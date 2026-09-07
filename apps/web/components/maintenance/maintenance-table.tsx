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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCancelMaintenance,
  useCompleteMaintenance,
  useMaintenanceRecords,
  useStartMaintenance,
  type MaintenanceStatus,
} from "@/hooks/use-maintenance";
import { ApiError } from "@/lib/api";

const STATUS_VARIANT: Record<MaintenanceStatus, "default" | "secondary" | "outline" | "destructive"> = {
  REPORTED: "secondary",
  IN_REPAIR: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
};

const ALL = "__all__";

export function MaintenanceTable() {
  const [status, setStatus] = useState<MaintenanceStatus | undefined>();
  const { data: records, isLoading } = useMaintenanceRecords({ status });
  const startMaintenance = useStartMaintenance();
  const completeMaintenance = useCompleteMaintenance();
  const cancelMaintenance = useCancelMaintenance();

  async function handleStart(id: string) {
    try {
      await startMaintenance.mutateAsync(id);
      toast.success("Repair started");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to start repair");
    }
  }

  async function handleComplete(id: string) {
    const raw = prompt("Repair cost (leave blank for none):");
    if (raw === null) return;
    const cost = raw.trim() ? Number(raw) : undefined;
    try {
      await completeMaintenance.mutateAsync({ id, cost });
      toast.success("Repair completed — cylinder is issuable again");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to complete repair");
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this maintenance report?")) return;
    try {
      await cancelMaintenance.mutateAsync(id);
      toast.success("Maintenance report cancelled");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={status ?? ALL}
        onValueChange={(v) => setStatus(v && v !== ALL ? (v as MaintenanceStatus) : undefined)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          <SelectItem value="REPORTED">Reported</SelectItem>
          <SelectItem value="IN_REPAIR">In repair</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record #</TableHead>
                <TableHead>Cylinder</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.maintenanceNumber}</TableCell>
                  <TableCell>{record.cylinder.internalCode}</TableCell>
                  <TableCell className="text-muted-foreground">{record.description ?? "—"}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{record.cost ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[record.status]}>{record.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    {(record.status === "REPORTED" || record.status === "IN_REPAIR") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {record.status === "REPORTED" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStart(record.id)}>
                                Start repair
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => handleCancel(record.id)}>
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {record.status === "IN_REPAIR" && (
                            <DropdownMenuItem onClick={() => handleComplete(record.id)}>
                              Complete repair
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {records?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No maintenance records.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
