"use client";

import { useState } from "react";
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
import { useCylinders } from "@/hooks/use-cylinders";
import { useCreateMaintenance } from "@/hooks/use-maintenance";
import { ApiError } from "@/lib/api";

const schema = z.object({
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateMaintenanceDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cylinderId, setCylinderId] = useState<string | null>(null);
  const createMaintenance = useCreateMaintenance();
  const { data: candidates } = useCylinders({ search: search || undefined });

  const { register, handleSubmit, reset } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
      setSearch("");
      setCylinderId(null);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!cylinderId) {
      toast.error("Select a cylinder first");
      return;
    }
    try {
      await createMaintenance.mutateAsync({ cylinderId, description: values.description });
      toast.success("Maintenance reported");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to report maintenance");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Report maintenance
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report a cylinder for maintenance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Cylinder</Label>
            <Input
              placeholder="Search internal code or serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-md border p-1">
              {candidates?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCylinderId(c.id)}
                  className={`flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                    cylinderId === c.id ? "bg-muted" : ""
                  }`}
                >
                  <span className="font-medium">{c.internalCode}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.availabilityStatus} · {c.conditionStatus}
                  </span>
                </button>
              ))}
              {candidates?.length === 0 && <p className="p-2 text-sm text-muted-foreground">No matches.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="What's wrong with it?" {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!cylinderId || createMaintenance.isPending}>
              {createMaintenance.isPending ? "Reporting..." : "Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
