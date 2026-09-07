"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LedgerTable } from "@/components/customers/ledger-table";
import {
  useCustomer,
  useCustomerCredit,
  useCustomerCylinders,
  useCustomerTransactions,
} from "@/hooks/use-customers";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(params.id);
  const { data: credit } = useCustomerCredit(params.id);
  const { data: holdings, isLoading: holdingsLoading } = useCustomerCylinders(params.id);
  const { data: transactions, isLoading: transactionsLoading } = useCustomerTransactions(params.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Customers
        </Link>
      </div>

      {isLoading || !customer ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
              <Badge variant={customer.status === "ACTIVE" ? "default" : "outline"}>{customer.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.customerCode} · {customer.customerType}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credit limit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold tabular-nums">
                  {customer.creditEnabled ? credit?.creditLimit ?? "—" : "Cash only"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current credit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold tabular-nums">{credit?.currentCredit ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available credit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold tabular-nums">
                  {customer.creditEnabled ? credit?.availableCredit ?? "—" : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cylinders held</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold tabular-nums">{holdings?.length ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="holdings">
            <TabsList>
              <TabsTrigger value="holdings">Cylinder holdings</TabsTrigger>
              <TabsTrigger value="transactions">Transaction history</TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="holdings" className="pt-4">
              {holdingsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Internal code</TableHead>
                        <TableHead>Serial number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Condition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holdings?.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">{h.internalCode}</TableCell>
                          <TableCell className="text-muted-foreground">{h.serialNumber}</TableCell>
                          <TableCell>{h.cylinderType.code}</TableCell>
                          <TableCell className="text-muted-foreground">{h.conditionStatus}</TableCell>
                        </TableRow>
                      ))}
                      {holdings?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No cylinders currently held.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="pt-4">
              {transactionsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Cylinder</TableHead>
                        <TableHead>When</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-xs">{t.transactionNumber}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{t.transactionType}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{t.cylinder.internalCode}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(t.transactionDate).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No transactions yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ledger" className="pt-4">
              <LedgerTable customerId={customer.id} />
            </TabsContent>
          </Tabs>

          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Contact and registration info</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Email</span>
              <span>{customer.email ?? "—"}</span>
              <span className="text-muted-foreground">Address</span>
              <span>{customer.address ?? "—"}</span>
              <span className="text-muted-foreground">Tax number</span>
              <span>{customer.taxNumber ?? "—"}</span>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
