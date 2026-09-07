import { CylinderAccountability } from "@/components/reports/cylinder-accountability";

export default function CylinderAccountabilityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cylinder Accountability</h1>
        <p className="text-sm text-muted-foreground">
          Every company cylinder accounted for: warehouse + customers + repair + inspection + scrap (§50).
        </p>
      </div>
      <CylinderAccountability />
    </div>
  );
}
