/**
 * Permission codes, RBAC-managed via the roles/permissions tables (§6.3).
 * The design's §6.3 list is explicitly "Examples", not exhaustive — the
 * *_VIEW codes are added here for symmetry with *_CREATE/_UPDATE so reads
 * and writes can be granted independently.
 */
export const PERMISSIONS = [
  "CYLINDER_CREATE",
  "CYLINDER_UPDATE",
  "CYLINDER_VIEW",
  "CYLINDER_TYPE_MANAGE",

  "WAREHOUSE_VIEW",
  "WAREHOUSE_MANAGE",

  "SUPPLIER_VIEW",
  "SUPPLIER_MANAGE",

  "INVENTORY_RECEIVE",
  "INVENTORY_ISSUE",
  "INVENTORY_RETURN",
  "INVENTORY_TRANSFER",
  "INVENTORY_ADJUST",

  "MAINTENANCE_MANAGE",

  "CUSTOMER_CREATE",
  "CUSTOMER_UPDATE",
  "CUSTOMER_VIEW",

  "PAYMENT_CREATE",
  "PAYMENT_VOID",

  "CREDIT_APPROVE",
  "APPROVAL_REVIEW",

  "REPORT_VIEW",

  "AUDIT_LOG_VIEW",

  "USER_VIEW",
  "USER_MANAGE",
  "ROLE_MANAGE",
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];

/** Recommended roles (§6.2) and the permissions each is seeded with. */
export const ROLE_DEFINITIONS: Record<string, { description: string; permissions: PermissionCode[] }> = {
  ADMIN: {
    description: "Full access to every module, including user and role management.",
    permissions: [...PERMISSIONS],
  },
  MANAGER: {
    description: "Operational oversight across inventory, customers, sales and reports.",
    permissions: [
      "CYLINDER_CREATE",
      "CYLINDER_UPDATE",
      "CYLINDER_VIEW",
      "CYLINDER_TYPE_MANAGE",
      "WAREHOUSE_VIEW",
      "WAREHOUSE_MANAGE",
      "SUPPLIER_VIEW",
      "SUPPLIER_MANAGE",
      "INVENTORY_RECEIVE",
      "INVENTORY_ISSUE",
      "INVENTORY_RETURN",
      "INVENTORY_TRANSFER",
      "INVENTORY_ADJUST",
      "MAINTENANCE_MANAGE",
      "CUSTOMER_CREATE",
      "CUSTOMER_UPDATE",
      "CUSTOMER_VIEW",
      "PAYMENT_CREATE",
      "CREDIT_APPROVE",
      "APPROVAL_REVIEW",
      "REPORT_VIEW",
      "AUDIT_LOG_VIEW",
      "USER_VIEW",
    ],
  },
  WAREHOUSE_MANAGER: {
    description: "Manages warehouse stock, receiving and cylinder movements.",
    permissions: [
      "CYLINDER_CREATE",
      "CYLINDER_UPDATE",
      "CYLINDER_VIEW",
      "WAREHOUSE_VIEW",
      "WAREHOUSE_MANAGE",
      "SUPPLIER_VIEW",
      "INVENTORY_RECEIVE",
      "INVENTORY_ISSUE",
      "INVENTORY_RETURN",
      "INVENTORY_TRANSFER",
      "INVENTORY_ADJUST",
      "MAINTENANCE_MANAGE",
      "CUSTOMER_VIEW",
      "REPORT_VIEW",
      "APPROVAL_REVIEW",
    ],
  },
  WAREHOUSE_WORKER: {
    description: "Day-to-day scan/issue/return/receive operations on the floor.",
    permissions: [
      "CYLINDER_VIEW",
      "WAREHOUSE_VIEW",
      "CUSTOMER_VIEW",
      "INVENTORY_RECEIVE",
      "INVENTORY_ISSUE",
      "INVENTORY_RETURN",
    ],
  },
  ACCOUNTANT: {
    description: "Payments, credit and financial reporting.",
    permissions: [
      "CUSTOMER_VIEW",
      "PAYMENT_CREATE",
      "PAYMENT_VOID",
      "CREDIT_APPROVE",
      "REPORT_VIEW",
    ],
  },
  VIEWER: {
    description: "Read-only access for oversight and audits.",
    permissions: ["CYLINDER_VIEW", "WAREHOUSE_VIEW", "SUPPLIER_VIEW", "CUSTOMER_VIEW", "REPORT_VIEW"],
  },
};
