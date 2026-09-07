"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { useCustomerBalancesReport, usePaymentsReport, useSalesReport } from "@/hooks/use-reports";

function firstOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function FinancialSummary() {
  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());

  const { data: salesReport, isLoading: salesLoading } = useSalesReport({ from, to });
  const { data: paymentsReport, isLoading: paymentsLoading } = usePaymentsReport({ from, to });
  const { data: balances, isLoading: balancesLoading } = useCustomerBalancesReport();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Sales" value={salesReport?.summary.total ?? 0} isLoading={salesLoading} />
        <StatCard label="Collected" value={paymentsReport?.summary.totalAmount ?? 0} isLoading={paymentsLoading} />
        <StatCard
          label="Outstanding (period)"
          value={salesReport?.summary.outstandingAmount ?? 0}
          isLoading={salesLoading}
        />
        <StatCard label="Sales count" value={salesReport?.summary.count ?? 0} isLoading={salesLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments by method</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : paymentsReport?.byMethod.length ? (
            <div className="flex flex-wrap gap-6 text-sm">
              {paymentsReport.byMethod.map((row) => (
                <div key={row.method} className="flex flex-col">
                  <span className="text-muted-foreground">{row.method.replace("_", " ")}</span>
                  <span className="text-lg font-semibold tabular-nums">{row.total}</span>
                  <span className="text-xs text-muted-foreground">{row.count} payment(s)</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payments in this range.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Customers with an outstanding balance</h2>
        {balancesLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead className="text-right">Balance owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances?.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell className="font-medium">{row.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.creditEnabled ? `Limit ${row.creditLimit}` : "Cash only"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.balance}</TableCell>
                  </TableRow>
                ))}
                {balances?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No outstanding balances.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
