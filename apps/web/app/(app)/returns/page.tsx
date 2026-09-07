import { CreateReturnDialog } from "@/components/returns/create-return-dialog";
import { ReturnsTable } from "@/components/returns/returns-table";

export default function ReturnsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Returns</h1>
          <p className="text-sm text-muted-foreground">
            Full and partial returns, inspection and repair routing (§20–§22).
          </p>
        </div>
        <CreateReturnDialog />
      </div>
      <ReturnsTable />
    </div>
  );
}
