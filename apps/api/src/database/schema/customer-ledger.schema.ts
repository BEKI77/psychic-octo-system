/**
 * §19 Customer Ledger — the immutable financial history, alongside the
 * ledger-based accounting principle (§2.3): never mutate a running balance
 * number, record events and let the balance be a consequence of them.
 *
 * This is written *alongside* — not instead of — the sales-table fields
 * (paidAmount/outstandingAmount/paymentStatus) that Phases 4-5 already
 * maintain and that CustomersService.getCredit() and the existing Sales/
 * Returns/Payments screens already read. Per §2.2 "current state +
 * immutable history": sales carries current state (already correct and
 * actively maintained), customer_ledger carries the append-only history
 * that Phase 6's Ledger tab and Credit Aging/statement reports read from.
 * Deliberately not switching the credit check to read the ledger — with no
 * backfill of Phase 4-5's pre-existing sales into it, that would silently
 * zero out every existing customer's credit usage.
 */
import { index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "./customer.schema.js";
import { users } from "./identity.schema.js";

export const ledgerTransactionTypeEnum = pgEnum("ledger_transaction_type", [
  "SALE",
  "PAYMENT",
  "RETURN",
  "REFUND",
  "ADJUSTMENT",
  "CREDIT_NOTE",
  "DEBIT_NOTE",
]);

export const customerLedger = pgTable(
  "customer_ledger",
  {
    id: uuid().primaryKey().defaultRandom(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id),

    transactionType: ledgerTransactionTypeEnum().notNull(),
    referenceType: text(),
    referenceId: uuid(),

    debit: numeric({ precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    credit: numeric({ precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    balance: numeric({ precision: 12, scale: 2, mode: "number" }).notNull(),

    notes: text(),
    transactionDate: timestamp({ withTimezone: true }).notNull().defaultNow(),

    createdBy: uuid()
      .notNull()
      .references(() => users.id),
  },
  (table) => [index("customer_ledger_customer_id_date_idx").on(table.customerId, table.transactionDate)],
);
