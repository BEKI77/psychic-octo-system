"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteRole, useRoles, type Role } from "@/hooks/use-roles";
import { ApiError } from "@/lib/api";
import { EditRoleDialog } from "./edit-role-dialog";

export function RolesTable() {
  const { data: roles, isLoading } = useRoles();
  const deleteRole = useDeleteRole();
  const [editing, setEditing] = useState<Role | null>(null);

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? Users with this role will lose it.`)) return;
    try {
      await deleteRole.mutateAsync(role.id);
      toast.success("Role deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete role");
    }
  }

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
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="text-muted-foreground">{role.description}</TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-1">
                    {role.rolePermissions.slice(0, 4).map((rp) => (
                      <Badge key={rp.permission.id} variant="secondary" className="font-mono text-[10px]">
                        {rp.permission.code}
                      </Badge>
                    ))}
                    {role.rolePermissions.length > 4 && (
                      <Badge variant="outline">+{role.rolePermissions.length - 4} more</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(role)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(role)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditRoleDialog role={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  );
}
