"use client";

import { ArrowUpRight, Boxes, CircleAlert, Gauge, ScanLine } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { useMe } from "@/hooks/use-me";
import { useInventorySummary } from "@/hooks/use-inventory";
import Link from "next/link";

function countFor(rows: { status: string; value: number }[] | undefined, status: string) { return rows?.find((r) => r.status === status)?.value ?? 0; }

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: summary, isLoading: summaryLoading } = useInventorySummary();
  const available = countFor(summary?.byAvailability, "AVAILABLE");
  const withCustomers = countFor(summary?.byAvailability, "WITH_CUSTOMER");
  const damaged = countFor(summary?.byCondition, "DAMAGED");
  return <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
    <section className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-primary-foreground shadow-xl shadow-primary/15 sm:px-7 sm:py-8"><div className="relative z-10 max-w-xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary-foreground/65 uppercase"><Gauge className="size-4" />Live operations</div><h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Good morning, keep the yard moving.</h1><p className="mt-2 max-w-lg text-sm leading-6 text-primary-foreground/72">Your cylinder inventory is live. Keep an eye on availability, customer-held stock, and exceptions that need attention.</p><div className="mt-5 flex flex-wrap gap-2"><Button render={<Link href="/scan" />} variant="secondary" size="sm"><ScanLine data-icon="inline-start" />Scan cylinder</Button><Button render={<Link href="/cylinders" />} variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">View inventory<ArrowUpRight data-icon="inline-end" /></Button></div></div><div className="absolute -right-12 -bottom-20 size-64 rounded-full border-[28px] border-accent/15" /></section>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"><StatCard label="Total cylinders" value={summary?.totalCylinders ?? 0} isLoading={summaryLoading} icon={Boxes} /><StatCard label="Available" value={available} isLoading={summaryLoading} tone="positive" /><StatCard label="With customers" value={withCustomers} isLoading={summaryLoading} tone="info" /><StatCard label="Damaged" value={damaged} isLoading={summaryLoading} tone={damaged > 0 ? "warning" : "default"} /></div>
    <Card><CardHeader className="border-b border-border/60 pb-4"><div className="flex items-start justify-between gap-4"><div><CardTitle>Today&apos;s activity</CardTitle><CardDescription className="mt-1">Inventory transactions recorded today</CardDescription></div><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/50 text-accent-foreground"><ArrowUpRight className="size-4" /></div></div></CardHeader><CardContent>{summaryLoading ? <Skeleton className="h-20 w-full" /> : summary?.todayActivity.length ? <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">{summary.todayActivity.map((row) => <div key={row.type} className="rounded-xl bg-muted/60 p-3"><span className="text-xs font-medium text-muted-foreground">{row.type}</span><span className="mt-1 block text-xl font-semibold tabular-nums">{row.value}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No activity yet today.</p>}</CardContent></Card>
    <Card className="max-w-2xl"><CardHeader className="border-b border-border/60 pb-4"><CardTitle className="flex items-center gap-2"><CircleAlert className="size-4 text-muted-foreground" />Signed in as</CardTitle><CardDescription>Your account and access level</CardDescription></CardHeader><CardContent className="flex flex-col gap-2 text-sm">{meLoading ? <Skeleton className="h-16 w-full" /> : <><div><span className="text-muted-foreground">Name: </span>{me?.user.firstName} {me?.user.lastName}</div><div><span className="text-muted-foreground">Email: </span>{me?.user.email}</div><div><span className="text-muted-foreground">Permissions: </span>{me?.permissions.length ?? 0}</div></>}</CardContent></Card>
  </div>;
}
