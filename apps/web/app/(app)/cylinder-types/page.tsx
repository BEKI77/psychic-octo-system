import { CreateCylinderTypeDialog } from "@/components/cylinder-types/cylinder-type-dialogs";
import { CylinderTypesTable } from "@/components/cylinder-types/cylinder-types-table";

export default function CylinderTypesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cylinder Types</h1>
          <p className="text-sm text-muted-foreground">
            Sizes and brands cylinders can be registered under (§8).
          </p>
        </div>
        <CreateCylinderTypeDialog />
      </div>
      <CylinderTypesTable />
    </div>
  );
}
