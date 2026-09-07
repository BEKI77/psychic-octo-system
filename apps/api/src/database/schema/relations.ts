/**
 * All `relations()` declarations live here (rather than alongside each table)
 * so identity.schema.ts and rbac.schema.ts never need to import each other.
 * Only used by Drizzle's relational query API (`db.query.*`); plain
 * `db.select()...join()` queries don't need this at all.
 */
import { relations } from "drizzle-orm";
import { accounts, sessions, users } from "./identity.schema.js";
import { permissions, rolePermissions, roles, userRoles } from "./rbac.schema.js";
import { warehouseLocations, warehouses } from "./warehouse.schema.js";
import { cylinderTypes } from "./cylinder-type.schema.js";
import { cylinders } from "./cylinder.schema.js";
import { suppliers } from "./supplier.schema.js";
import { receiptItems, receipts } from "./receipt.schema.js";
import { inventoryTransactions } from "./inventory-transaction.schema.js";
import { customers } from "./customer.schema.js";
import { saleItems, sales } from "./sale.schema.js";
import { paymentAllocations, payments } from "./payment.schema.js";
import { returnItems, returns } from "./return.schema.js";
import { maintenanceRecords } from "./maintenance.schema.js";
import { customerLedger } from "./customer-ledger.schema.js";
import { auditLogs } from "./audit-log.schema.js";
import { notifications } from "./notification.schema.js";
import { approvalRequests } from "./approval.schema.js";
import { userWarehouses } from "./user-warehouse.schema.js";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  userRoles: many(userRoles),
  userWarehouses: many(userWarehouses),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  locations: many(warehouseLocations),
  cylinders: many(cylinders),
  userWarehouses: many(userWarehouses),
}));

export const warehouseLocationsRelations = relations(warehouseLocations, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseLocations.warehouseId],
    references: [warehouses.id],
  }),
  parent: one(warehouseLocations, {
    fields: [warehouseLocations.parentId],
    references: [warehouseLocations.id],
    relationName: "location_parent",
  }),
  children: many(warehouseLocations, { relationName: "location_parent" }),
  cylinders: many(cylinders),
}));

export const cylinderTypesRelations = relations(cylinderTypes, ({ many }) => ({
  cylinders: many(cylinders),
}));

export const cylindersRelations = relations(cylinders, ({ one }) => ({
  cylinderType: one(cylinderTypes, {
    fields: [cylinders.cylinderTypeId],
    references: [cylinderTypes.id],
  }),
  currentWarehouse: one(warehouses, {
    fields: [cylinders.currentWarehouseId],
    references: [warehouses.id],
  }),
  currentLocation: one(warehouseLocations, {
    fields: [cylinders.currentLocationId],
    references: [warehouseLocations.id],
  }),
  currentCustomer: one(customers, {
    fields: [cylinders.currentCustomerId],
    references: [customers.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [receipts.supplierId], references: [suppliers.id] }),
  warehouse: one(warehouses, { fields: [receipts.warehouseId], references: [warehouses.id] }),
  createdByUser: one(users, { fields: [receipts.createdBy], references: [users.id] }),
  approvedByUser: one(users, { fields: [receipts.approvedBy], references: [users.id] }),
  items: many(receiptItems),
}));

export const receiptItemsRelations = relations(receiptItems, ({ one }) => ({
  receipt: one(receipts, { fields: [receiptItems.receiptId], references: [receipts.id] }),
  cylinder: one(cylinders, { fields: [receiptItems.cylinderId], references: [cylinders.id] }),
  location: one(warehouseLocations, {
    fields: [receiptItems.locationId],
    references: [warehouseLocations.id],
  }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  cylinder: one(cylinders, {
    fields: [inventoryTransactions.cylinderId],
    references: [cylinders.id],
  }),
  fromWarehouse: one(warehouses, {
    fields: [inventoryTransactions.fromWarehouseId],
    references: [warehouses.id],
  }),
  toWarehouse: one(warehouses, {
    fields: [inventoryTransactions.toWarehouseId],
    references: [warehouses.id],
  }),
  fromLocation: one(warehouseLocations, {
    fields: [inventoryTransactions.fromLocationId],
    references: [warehouseLocations.id],
  }),
  toLocation: one(warehouseLocations, {
    fields: [inventoryTransactions.toLocationId],
    references: [warehouseLocations.id],
  }),
  fromCustomer: one(customers, {
    fields: [inventoryTransactions.fromCustomerId],
    references: [customers.id],
  }),
  toCustomer: one(customers, {
    fields: [inventoryTransactions.toCustomerId],
    references: [customers.id],
  }),
  performedByUser: one(users, {
    fields: [inventoryTransactions.performedBy],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  cylinders: many(cylinders),
  sales: many(sales),
  payments: many(payments),
  returns: many(returns),
  ledgerEntries: many(customerLedger),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  warehouse: one(warehouses, { fields: [sales.warehouseId], references: [warehouses.id] }),
  createdByUser: one(users, { fields: [sales.createdBy], references: [users.id] }),
  approvedByUser: one(users, { fields: [sales.approvedBy], references: [users.id] }),
  items: many(saleItems),
  paymentAllocations: many(paymentAllocations),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  cylinder: one(cylinders, { fields: [saleItems.cylinderId], references: [cylinders.id] }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
  receivedByUser: one(users, { fields: [payments.receivedBy], references: [users.id] }),
  allocations: many(paymentAllocations),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(payments, { fields: [paymentAllocations.paymentId], references: [payments.id] }),
  sale: one(sales, { fields: [paymentAllocations.saleId], references: [sales.id] }),
}));

export const returnsRelations = relations(returns, ({ one, many }) => ({
  customer: one(customers, { fields: [returns.customerId], references: [customers.id] }),
  warehouse: one(warehouses, { fields: [returns.warehouseId], references: [warehouses.id] }),
  receivedByUser: one(users, { fields: [returns.receivedBy], references: [users.id] }),
  approvedByUser: one(users, { fields: [returns.approvedBy], references: [users.id] }),
  items: many(returnItems),
}));

export const returnItemsRelations = relations(returnItems, ({ one }) => ({
  return: one(returns, { fields: [returnItems.returnId], references: [returns.id] }),
  saleItem: one(saleItems, { fields: [returnItems.saleItemId], references: [saleItems.id] }),
  cylinder: one(cylinders, { fields: [returnItems.cylinderId], references: [cylinders.id] }),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  cylinder: one(cylinders, { fields: [maintenanceRecords.cylinderId], references: [cylinders.id] }),
  performedByUser: one(users, { fields: [maintenanceRecords.performedBy], references: [users.id] }),
  approvedByUser: one(users, { fields: [maintenanceRecords.approvedBy], references: [users.id] }),
}));

export const customerLedgerRelations = relations(customerLedger, ({ one }) => ({
  customer: one(customers, { fields: [customerLedger.customerId], references: [customers.id] }),
  createdByUser: one(users, { fields: [customerLedger.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one }) => ({
  requestedByUser: one(users, { fields: [approvalRequests.requestedBy], references: [users.id] }),
  reviewedByUser: one(users, { fields: [approvalRequests.reviewedBy], references: [users.id] }),
}));

export const userWarehousesRelations = relations(userWarehouses, ({ one }) => ({
  user: one(users, { fields: [userWarehouses.userId], references: [users.id] }),
  warehouse: one(warehouses, { fields: [userWarehouses.warehouseId], references: [warehouses.id] }),
}));
