"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMovements } from "@/hooks/use-inventory";

const TRANSACTION_TYPES = [
  "RECEIVE",
  "ISSUE",
  "RETURN",
  "TRANSFER",
  "MOVE",
  "INSPECTION",
  "REPAIR_START",
  "REPAIR_COMPLETE",
  "DAMAGE",
  "SCRAP",
  "ADJUSTMENT",
] as const;

const ALL = "__all__";

function locationLabel(w: { code: string } | null, l: { code: string } | null) {
  if (!w) return "—";
  return l ? `${w.code} / ${l.code}` : w.code;
}

export function MovementsTable() {
  const [transactionType, setTransactionType] = useState<string | undefined>();
  const { data: movements, isLoading } = useMovements({ transactionType });

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={transactionType ?? ALL}
        onValueChange={(v) => setTransactionType(v && v !== ALL ? v : undefined)}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All transaction types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All transaction types</SelectItem>
          {TRANSACTION_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cylinder</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>By</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.transactionNumber}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.transactionType}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{m.cylinder.internalCode}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {locationLabel(m.fromWarehouse, m.fromLocation)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {locationLabel(m.toWarehouse, m.toLocation)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.conditionBefore && m.conditionAfter && m.conditionBefore !== m.conditionAfter
                      ? `${m.conditionBefore} → ${m.conditionAfter}`
                      : (m.conditionAfter ?? "—")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.performedByUser.username}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(m.transactionDate).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {movements?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No movements yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
