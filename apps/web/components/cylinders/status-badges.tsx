import { Badge } from "@/components/ui/badge";
import type { AvailabilityStatus, ConditionStatus } from "@/hooks/use-cylinders";

const AVAILABILITY_VARIANT: Record<AvailabilityStatus, "default" | "secondary" | "outline" | "destructive"> = {
  AVAILABLE: "default",
  RESERVED: "secondary",
  WITH_CUSTOMER: "secondary",
  IN_TRANSIT: "secondary",
  BLOCKED: "destructive",
  SCRAPPED: "outline",
};

const CONDITION_VARIANT: Record<ConditionStatus, "default" | "secondary" | "outline" | "destructive"> = {
  GOOD: "default",
  DAMAGED: "destructive",
  NEEDS_INSPECTION: "secondary",
  UNDER_REPAIR: "secondary",
  REPAIRED: "secondary",
  SCRAPPED: "outline",
};

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  return <Badge variant={AVAILABILITY_VARIANT[status]}>{status.replace("_", " ")}</Badge>;
}

export function ConditionBadge({ status }: { status: ConditionStatus }) {
  return <Badge variant={CONDITION_VARIANT[status]}>{status.replace("_", " ")}</Badge>;
}
