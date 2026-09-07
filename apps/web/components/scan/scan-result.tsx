"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvailabilityBadge, ConditionBadge } from "@/components/cylinders/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Cylinder } from "@/hooks/use-cylinders";

function locationLabel(cylinder: Cylinder) {
  if (!cylinder.currentWarehouse) return "—";
  return cylinder.currentLocation
    ? `${cylinder.currentWarehouse.name} / ${cylinder.currentLocation.code}`
    : cylinder.currentWarehouse.name;
}

/** §7 Universal Scan Experience — the three post-scan states, verbatim. */
export function CylinderFoundCard({ cylinder, onSelect }: { cylinder: Cylinder; onSelect: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-500" />
        <p className="text-lg font-semibold">Cylinder Found</p>
        <div>
          <p className="font-mono text-sm">{cylinder.internalCode}</p>
          <p className="text-sm text-muted-foreground">{cylinder.cylinderType.name}</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 text-left text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <AvailabilityBadge status={cylinder.availabilityStatus} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Condition</p>
            <ConditionBadge status={cylinder.conditionStatus} />
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Location</p>
            <p>{locationLabel(cylinder)}</p>
          </div>
        </div>
        <Button className="w-full" onClick={onSelect}>
          Select Cylinder
        </Button>
      </CardContent>
    </Card>
  );
}

export function CylinderNotFoundCard({ onScanAgain, onEnterManually }: { onScanAgain: () => void; onEnterManually: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="size-8 text-destructive" />
        <p className="text-lg font-semibold">Cylinder Not Found</p>
        <p className="text-sm text-muted-foreground">
          The scanned code does not belong to a registered cylinder.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Button onClick={onScanAgain}>Scan Again</Button>
          <Button variant="outline" onClick={onEnterManually}>
            Enter Manually
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CylinderCannotIssueCard({ cylinder, onScanAgain }: { cylinder: Cylinder; onScanAgain: () => void }) {
  const router = useRouter();
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <XCircle className="size-8 text-amber-600 dark:text-amber-500" />
        <p className="text-lg font-semibold">Cylinder Cannot Be Issued</p>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Current status</p>
          <AvailabilityBadge status={cylinder.availabilityStatus} />
          {cylinder.availabilityStatus !== "AVAILABLE" && cylinder.conditionStatus !== "GOOD" && (
            <ConditionBadge status={cylinder.conditionStatus} />
          )}
        </div>
        {cylinder.currentCustomer && (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="font-medium">{cylinder.currentCustomer.name}</p>
          </div>
        )}
        <div className="flex w-full flex-col gap-2">
          <Button variant="outline" onClick={() => router.push(`/cylinders?q=${encodeURIComponent(cylinder.internalCode)}`)}>
            View Cylinder
          </Button>
          <Button onClick={onScanAgain}>Scan Another</Button>
        </div>
      </CardContent>
    </Card>
  );
}
