"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWarehouse } from "@/hooks/use-warehouses";
import { CreateLocationDialog } from "@/components/warehouses/location-dialogs";
import { LocationsTable } from "@/components/warehouses/locations-table";

export default function WarehouseDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: warehouse, isLoading } = useWarehouse(params.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/warehouses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Warehouses
        </Link>
      </div>

      {isLoading || !warehouse ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{warehouse.name}</h1>
              <p className="text-sm text-muted-foreground">
                {warehouse.code}
                {warehouse.address ? ` · ${warehouse.address}` : ""}
              </p>
            </div>
            <CreateLocationDialog warehouseId={warehouse.id} locations={warehouse.locations} />
          </div>
          <LocationsTable warehouseId={warehouse.id} locations={warehouse.locations} />
        </>
      )}
    </div>
  );
}
