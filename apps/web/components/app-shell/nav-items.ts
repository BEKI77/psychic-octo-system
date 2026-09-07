import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  PackageCheck,
  ReceiptText,
  ScanLine,
  ShieldCheck,
  Truck,
  Undo2,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { PermissionCode } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hide the item unless the current user holds this permission. */
  requires?: PermissionCode;
}

export interface NavGroup {
  label: string | null;
  items: NavItem[];
}

// Mirrors §62 Recommended Navigation — grows phase by phase; only sections
// implemented so far are wired up (Transfers/Adjustments live inline on the
// Cylinders screen).
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Inventory",
    items: [
      { href: "/scan", label: "Scan", icon: ScanLine, requires: "CYLINDER_VIEW" },
      { href: "/cylinders", label: "Cylinders", icon: Boxes, requires: "CYLINDER_VIEW" },
      { href: "/receiving", label: "Receiving", icon: PackageCheck, requires: "INVENTORY_RECEIVE" },
      { href: "/movements", label: "Movements", icon: History, requires: "CYLINDER_VIEW" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/sales", label: "Sales", icon: ReceiptText, requires: "INVENTORY_ISSUE" },
      { href: "/returns", label: "Returns", icon: Undo2, requires: "INVENTORY_RETURN" },
      { href: "/payments", label: "Payments", icon: CreditCard, requires: "CUSTOMER_VIEW" },
    ],
  },
  {
    label: "Maintenance",
    items: [
      { href: "/maintenance", label: "Repairs", icon: Wrench, requires: "MAINTENANCE_MANAGE" },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/reports/credit-aging", label: "Credit Aging", icon: AlarmClock, requires: "REPORT_VIEW" },
      { href: "/reports/financial", label: "Financial Summary", icon: BarChart3, requires: "REPORT_VIEW" },
      { href: "/reports/inventory", label: "Inventory Report", icon: Boxes, requires: "REPORT_VIEW" },
      {
        href: "/reports/cylinder-accountability",
        label: "Cylinder Accountability",
        icon: ClipboardList,
        requires: "REPORT_VIEW",
      },
    ],
  },
  {
    label: null,
    items: [
      { href: "/customers", label: "Customers", icon: UsersRound, requires: "CUSTOMER_VIEW" },
      { href: "/suppliers", label: "Suppliers", icon: Truck, requires: "SUPPLIER_VIEW" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users", icon: Users, requires: "USER_VIEW" },
      { href: "/roles", label: "Roles", icon: ShieldCheck, requires: "USER_VIEW" },
      { href: "/warehouses", label: "Warehouses", icon: Building2, requires: "WAREHOUSE_VIEW" },
      { href: "/cylinder-types", label: "Cylinder Types", icon: Boxes, requires: "CYLINDER_VIEW" },
      { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList, requires: "AUDIT_LOG_VIEW" },
    ],
  },
];
