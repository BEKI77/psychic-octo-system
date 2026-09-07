"use client";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useWarehouses } from "@/hooks/use-warehouses";

/** §66 Phase 8 Multiple Warehouses — none selected means unrestricted (every warehouse). */
export function WarehouseCheckboxes({
  value,
  onChange,
}: {
  value: string[];
  onChange: (warehouseIds: string[]) => void;
}) {
  const { data: warehouses, isLoading } = useWarehouses();

  function toggle(warehouseId: string, checked: boolean) {
    onChange(checked ? [...value, warehouseId] : value.filter((id) => id !== warehouseId));
  }

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      {warehouses?.map((warehouse) => (
        <div key={warehouse.id} className="flex items-start gap-2">
          <input
            id={`warehouse-${warehouse.id}`}
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            checked={value.includes(warehouse.id)}
            onChange={(e) => toggle(warehouse.id, e.target.checked)}
          />
          <Label htmlFor={`warehouse-${warehouse.id}`} className="flex flex-col gap-0.5 font-normal">
            <span className="font-medium">{warehouse.name}</span>
            <span className="text-xs text-muted-foreground">{warehouse.code}</span>
          </Label>
        </div>
      ))}
      {warehouses?.length === 0 && <p className="text-sm text-muted-foreground">No warehouses yet.</p>}
      <p className="text-xs text-muted-foreground">None selected = unrestricted (every warehouse).</p>
    </div>
  );
}
