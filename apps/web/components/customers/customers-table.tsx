"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomers, type Customer } from "@/hooks/use-customers";
import { EditCustomerDialog } from "./customer-dialogs";

const STATUS_VARIANT: Record<Customer["status"], "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "outline",
  BLOCKED: "destructive",
};

export function CustomersTable() {
  const { data: customers, isLoading } = useCustomers();
  const [editing, setEditing] = useState<Customer | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <Link href={`/customers/${customer.id}`} className="hover:underline">
                    {customer.customerCode}
                  </Link>
                </TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">{customer.customerType}</TableCell>
                <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.creditEnabled ? customer.creditLimit : "Cash only"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[customer.status]}>{customer.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem render={<Link href={`/customers/${customer.id}`} />}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditing(customer)}>Edit</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {customers?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No customers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <EditCustomerDialog customer={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  );
}
