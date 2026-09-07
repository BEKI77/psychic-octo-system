"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LOCATION_TYPES,
  useCreateLocation,
  useUpdateLocation,
  type Location,
  type LocationType,
} from "@/hooks/use-warehouses";
import { ApiError } from "@/lib/api";

const NONE = "__none__";

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  locationType: z.enum(LOCATION_TYPES),
  parentId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function TypeSelect({
  value,
  onChange,
}: {
  value: LocationType | undefined;
  onChange: (value: LocationType) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LocationType)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a type" />
      </SelectTrigger>
      <SelectContent>
        {LOCATION_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ParentSelect({
  locations,
  excludeId,
  value,
  onChange,
}: {
  locations: Location[];
  excludeId?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v && v !== NONE ? v : undefined)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="None (top level)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>None (top level)</SelectItem>
        {locations
          .filter((l) => l.id !== excludeId)
          .map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.code} — {location.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

export function CreateLocationDialog({
  warehouseId,
  locations,
}: {
  warehouseId: string;
  locations: Location[];
}) {
  const [open, setOpen] = useState(false);
  const createLocation = useCreateLocation(warehouseId);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset({ code: "", name: "", locationType: undefined, parentId: undefined });
  }

  async function onSubmit(values: FormValues) {
    try {
      await createLocation.mutateAsync(values);
      toast.success("Location created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create location");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        New location
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="loc-code">Code</Label>
              <Input id="loc-code" placeholder="Z-A" {...register("code")} />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <TypeSelect value={watch("locationType")} onChange={(v) => setValue("locationType", v)} />
              {errors.locationType && (
                <p className="text-sm text-destructive">{errors.locationType.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="loc-name">Name</Label>
            <Input id="loc-name" placeholder="Zone A" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Parent location</Label>
            <ParentSelect
              locations={locations}
              value={watch("parentId")}
              onChange={(v) => setValue("parentId", v)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createLocation.isPending}>
              {createLocation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditLocationDialog({
  warehouseId,
  location,
  locations,
  onOpenChange,
}: {
  warehouseId: string;
  location: Location | null;
  locations: Location[];
  onOpenChange: (open: boolean) => void;
}) {
  const updateLocation = useUpdateLocation(warehouseId);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (location) {
      reset({
        code: location.code,
        name: location.name,
        locationType: location.locationType,
        parentId: location.parentId ?? undefined,
      });
    }
  }, [location, reset]);

  async function onSubmit(values: FormValues) {
    if (!location) return;
    try {
      await updateLocation.mutateAsync({
        id: location.id,
        name: values.name,
        locationType: values.locationType,
        parentId: values.parentId ?? null,
      });
      toast.success("Location updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update location");
    }
  }

  return (
    <Dialog open={location !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit location</DialogTitle>
        </DialogHeader>
        {location && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-loc-code">Code</Label>
                <Input id="edit-loc-code" disabled {...register("code")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <TypeSelect value={watch("locationType")} onChange={(v) => setValue("locationType", v)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-loc-name">Name</Label>
              <Input id="edit-loc-name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Parent location</Label>
              <ParentSelect
                locations={locations}
                excludeId={location.id}
                value={watch("parentId")}
                onChange={(v) => setValue("parentId", v)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateLocation.isPending}>
                {updateLocation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
