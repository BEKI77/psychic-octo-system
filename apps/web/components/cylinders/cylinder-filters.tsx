"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABILITY_STATUSES, CONDITION_STATUSES, type CylinderFilters } from "@/hooks/use-cylinders";
import { useCylinderTypes } from "@/hooks/use-cylinder-types";
import { useWarehouses } from "@/hooks/use-warehouses";

const ALL = "__all__";

/** Base UI's Select emits `string | null` (null when cleared); collapse that + the "all" sentinel to undefined. */
function cleanValue(value: string | null): string | undefined {
  return value && value !== ALL ? value : undefined;
}

export function CylinderFiltersBar({
  filters,
  onChange,
}: {
  filters: CylinderFilters;
  onChange: (filters: CylinderFilters) => void;
}) {
  const { data: types } = useCylinderTypes();
  const { data: warehouses } = useWarehouses();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search internal code or serial..."
          className="w-64 pl-8"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
        />
      </div>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(v) => onChange({ ...filters, status: cleanValue(v) as CylinderFilters["status"] })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {AVAILABILITY_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.condition ?? ALL}
        onValueChange={(v) =>
          onChange({ ...filters, condition: cleanValue(v) as CylinderFilters["condition"] })
        }
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Condition" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All conditions</SelectItem>
          {CONDITION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.type ?? ALL}
        onValueChange={(v) => onChange({ ...filters, type: cleanValue(v) })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {types?.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.warehouse ?? ALL}
        onValueChange={(v) => onChange({ ...filters, warehouse: cleanValue(v) })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Warehouse" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All warehouses</SelectItem>
          {warehouses?.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
