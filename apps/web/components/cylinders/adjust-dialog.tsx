"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AVAILABILITY_STATUSES,
  CONDITION_STATUSES,
  type AvailabilityStatus,
  type ConditionStatus,
  type Cylinder,
} from "@/hooks/use-cylinders";
import { useAdjustment } from "@/hooks/use-inventory";
import { ApiError } from "@/lib/api";

export function AdjustDialog({
  cylinder,
  onOpenChange,
}: {
  cylinder: Cylinder | null;
  onOpenChange: (open: boolean) => void;
}) {
  const adjustment = useAdjustment();
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus | undefined>();
  const [conditionStatus, setConditionStatus] = useState<ConditionStatus | undefined>();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (cylinder) {
      setAvailabilityStatus(cylinder.availabilityStatus);
      setConditionStatus(cylinder.conditionStatus);
      setNotes("");
    }
  }, [cylinder]);

  async function handleSubmit() {
    if (!cylinder) return;
    if (!notes.trim()) {
      toast.error("A reason is required for manual adjustments");
      return;
    }
    try {
      await adjustment.mutateAsync({
        cylinderId: cylinder.id,
        availabilityStatus,
        conditionStatus,
        notes,
      });
      toast.success(`${cylinder.internalCode} adjusted`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to adjust cylinder");
    }
  }

  return (
    <Dialog open={cylinder !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust{cylinder ? `: ${cylinder.internalCode}` : ""}</DialogTitle>
        </DialogHeader>
        {cylinder && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Manual correction (§41) — use this instead of deleting or issuing/returning through the
              normal workflow. Every adjustment is logged with your note.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label>Availability</Label>
              <Select
                value={availabilityStatus}
                onValueChange={(v) => setAvailabilityStatus(v as AvailabilityStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABILITY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Condition</Label>
              <Select value={conditionStatus} onValueChange={(v) => setConditionStatus(v as ConditionStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adjust-notes">Reason (required)</Label>
              <Input id="adjust-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit} disabled={adjustment.isPending}>
                {adjustment.isPending ? "Saving..." : "Apply adjustment"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
