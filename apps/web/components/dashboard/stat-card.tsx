import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  isLoading,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  isLoading?: boolean;
  tone?: "default" | "positive" | "info" | "warning" | "danger";
  icon?: LucideIcon;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</CardTitle>
        {Icon ? <Icon className="size-4 shrink-0 text-primary/65" /> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums",
              tone === "positive" && "text-emerald-700 dark:text-emerald-400",
              tone === "info" && "text-primary",
              tone === "warning" && "text-amber-600 dark:text-amber-500",
              tone === "danger" && "text-destructive",
            )}
          >
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
