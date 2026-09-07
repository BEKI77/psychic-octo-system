"use client";

import { Boxes, Building2, ClipboardCheck, Trash2, UsersRound, Wrench } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCylinderAccountabilityReport } from "@/hooks/use-reports";

/**
 * §50 Cylinder Accountability — Total company cylinders = Warehouse +
 * Customers + Repair + Inspection + Scrap. The five buckets are a strict
 * partition (see reports.service.ts's cylinderAccountability comment), so
 * the sum shown here should always equal the "Total" card — this view
 * makes that check visible rather than just trusting the backend silently.
 */
export function CylinderAccountability() {
  const { data, isLoading } = useCylinderAccountabilityReport();

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;

  const sum = data.warehouse + data.customers + data.repair + data.inspection + data.scrap;
  const balanced = sum === data.total;

  return (
    <div className="flex flex-col gap-6">
      <StatCard label="Total company cylinders" value={data.total} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <BucketCard icon={Building2} label="Warehouse" value={data.warehouse} />
        <BucketCard icon={UsersRound} label="Customers" value={data.customers} />
        <BucketCard icon={Wrench} label="Repair" value={data.repair} />
        <BucketCard icon={ClipboardCheck} label="Inspection" value={data.inspection} />
        <BucketCard icon={Trash2} label="Scrap" value={data.scrap} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm">
          <span className="tabular-nums">
            {data.warehouse} + {data.customers} + {data.repair} + {data.inspection} + {data.scrap} ={" "}
            <span className="font-semibold">{sum}</span>
          </span>
          <span
            className={
              balanced
                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
            }
          >
            {balanced ? "Balanced" : `Discrepancy: ${sum - data.total}`}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

function BucketCard({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
        <Icon className="size-5 text-muted-foreground" />
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
