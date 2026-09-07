"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Scanner } from "@/components/scan/scanner";
import { CylinderCannotIssueCard, CylinderFoundCard, CylinderNotFoundCard } from "@/components/scan/scan-result";
import type { Cylinder } from "@/hooks/use-cylinders";
import { useLookupCylinder } from "@/hooks/use-cylinders";
import { ApiError } from "@/lib/api";

type ScanState =
  | { kind: "scanning"; manual?: boolean }
  | { kind: "found"; cylinder: Cylinder }
  | { kind: "not-found" };

/**
 * §7 Universal Scan Experience. The scanner never silently accepts an
 * invalid cylinder — every scan resolves to exactly one of the three cards
 * below before any further action is offered.
 */
export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const lookup = useLookupCylinder();

  async function handleScan(code: string) {
    if (lookup.isPending) return; // ignore rapid-fire frames while a lookup is in flight
    try {
      const cylinder = await lookup.mutateAsync(code);
      setState({ kind: "found", cylinder });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState({ kind: "not-found" });
      } else {
        // A real network/server failure, not "no such cylinder" — don't
        // claim not-found for that; let the user try the same scan again.
        toast.error(err instanceof ApiError ? err.message : "Lookup failed — try again");
      }
    }
  }

  const issuable =
    state.kind === "found" && state.cylinder.availabilityStatus === "AVAILABLE" && state.cylinder.conditionStatus === "GOOD";

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scan Cylinder</h1>
        <p className="text-sm text-muted-foreground">Camera QR/barcode scan or manual code entry (§7).</p>
      </div>

      {state.kind === "scanning" && (
        <Scanner key={state.manual ? "manual" : "camera"} active onScan={handleScan} initialManual={state.manual} />
      )}

      {state.kind === "found" && issuable && (
        <CylinderFoundCard
          cylinder={state.cylinder}
          onSelect={() => router.push(`/cylinders?q=${encodeURIComponent(state.cylinder.internalCode)}`)}
        />
      )}

      {state.kind === "found" && !issuable && (
        <CylinderCannotIssueCard cylinder={state.cylinder} onScanAgain={() => setState({ kind: "scanning" })} />
      )}

      {state.kind === "not-found" && (
        <CylinderNotFoundCard
          onScanAgain={() => setState({ kind: "scanning" })}
          onEnterManually={() => setState({ kind: "scanning", manual: true })}
        />
      )}
    </div>
  );
}
