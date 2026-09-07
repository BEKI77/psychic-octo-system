"use client";

import { ScanLine } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CreateCylinderDialog } from "@/components/cylinders/create-cylinder-dialog";
import { CylinderFiltersBar } from "@/components/cylinders/cylinder-filters";
import { CylindersTable } from "@/components/cylinders/cylinders-table";
import { Button } from "@/components/ui/button";
import type { CylinderFilters } from "@/hooks/use-cylinders";

export default function CylindersPage() {
  // Seeded from ?q= when arriving via the Scan page's "View Cylinder" action (§7).
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<CylinderFilters>(() => {
    const q = searchParams.get("q");
    return q ? { search: q } : {};
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cylinders</h1>
          <p className="text-sm text-muted-foreground">
            Every physical cylinder, individually tracked (§9).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/scan" />}>
            <ScanLine />
            Scan
          </Button>
          <CreateCylinderDialog />
        </div>
      </div>
      <CylinderFiltersBar filters={filters} onChange={setFilters} />
      <CylindersTable filters={filters} />
    </div>
  );
}
