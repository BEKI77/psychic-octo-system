"use client";

import type { Html5Qrcode } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * §7 Universal Scan Experience — camera QR/barcode scanning with a manual
 * entry fallback (an external Bluetooth scanner also just "types" into the
 * manual field as far as this component is concerned, since such scanners
 * emit keystrokes + Enter). `html5-qrcode` is dynamically imported inside
 * the effect, not statically, per §38 "lazy-loaded scanner dependencies" —
 * it (and its zxing/decoder payload) is only fetched once this component
 * actually mounts, e.g. when the /scan page or a scan dialog opens.
 */
export function Scanner({
  onScan,
  active = true,
  initialManual = false,
}: {
  onScan: (code: string) => void;
  active?: boolean;
  /** Open straight into the manual-entry form (the "Enter Manually" retry path). */
  initialManual?: boolean;
}) {
  const elementId = `scanner-${useId().replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(initialManual);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(elementId, { verbose: false });
      scannerRef.current = scanner;
      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          (decodedText) => onScanRef.current(decodedText),
          () => {
            // Fires on nearly every frame with no code in view — expected, ignore.
          },
        )
        .catch(() => {
          if (!cancelled) {
            setCameraError("Camera unavailable. Enter the code manually below.");
            setShowManual(true);
          }
        });
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      } else {
        scanner?.clear();
      }
    };
  }, [active, elementId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-lg border bg-black">
        <div id={elementId} className="h-full w-full" />
      </div>
      <p className="text-center text-sm text-muted-foreground">Align the QR/barcode inside the frame</p>
      {cameraError && <p className="text-center text-sm text-destructive">{cameraError}</p>}

      {!showManual ? (
        <Button variant="outline" onClick={() => setShowManual(true)}>
          Enter Code Manually
        </Button>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const code = manualCode.trim();
            if (code) {
              onScan(code);
              setManualCode("");
            }
          }}
        >
          <Input
            autoFocus
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Enter cylinder code"
          />
          <Button type="submit">Look up</Button>
        </form>
      )}
    </div>
  );
}
