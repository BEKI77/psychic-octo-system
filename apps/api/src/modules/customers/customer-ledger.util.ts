import { desc, eq } from "drizzle-orm";
import type { Database } from "../../database/db.js";
import { customerLedger } from "../../database/schema/index.js";

export type LedgerTransactionType =
  | "SALE"
  | "PAYMENT"
  | "RETURN"
  | "REFUND"
  | "ADJUSTMENT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE";

/**
 * Appends one customer_ledger entry and returns the new running balance.
 * Never updates a previous row (§2.3 ledger-based accounting) — must be
 * called from inside the same `db.transaction(...)` as the business action
 * it's recording, passing that transaction's `tx` (not the top-level `db`),
 * so the balance-lookup + insert are atomic with everything else in that
 * transaction and can't race another concurrent entry for the same customer.
 */
// `db.transaction(async (tx) => ...)` gives a `tx` with the same query-
// builder surface as `db` minus the `$client` pool handle — Omit that one
// property so both `db` and any `tx` structurally satisfy this parameter.
type Queryable = Omit<Database, "$client">;

export async function recordLedgerEntry(
  tx: Queryable,
  params: {
    customerId: string;
    transactionType: LedgerTransactionType;
    debit?: number;
    credit?: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    userId: string;
  },
) {
  const [last] = await tx
    .select({ balance: customerLedger.balance })
    .from(customerLedger)
    .where(eq(customerLedger.customerId, params.customerId))
    .orderBy(desc(customerLedger.transactionDate))
    .limit(1);

  const debit = params.debit ?? 0;
  const credit = params.credit ?? 0;
  const balance = (last?.balance ?? 0) + debit - credit;

  await tx.insert(customerLedger).values({
    customerId: params.customerId,
    transactionType: params.transactionType,
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    debit,
    credit,
    balance,
    notes: params.notes,
    createdBy: params.userId,
  });

  return balance;
}
