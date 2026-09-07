CREATE TYPE "public"."ledger_transaction_type" AS ENUM('SALE', 'PAYMENT', 'RETURN', 'REFUND', 'ADJUSTMENT', 'CREDIT_NOTE', 'DEBIT_NOTE');--> statement-breakpoint
CREATE TABLE "customer_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_type" "ledger_transaction_type" NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"debit" numeric(12, 2) DEFAULT 0 NOT NULL,
	"credit" numeric(12, 2) DEFAULT 0 NOT NULL,
	"balance" numeric(12, 2) NOT NULL,
	"notes" text,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_ledger" ADD CONSTRAINT "customer_ledger_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_ledger" ADD CONSTRAINT "customer_ledger_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_ledger_customer_id_date_idx" ON "customer_ledger" USING btree ("customer_id","transaction_date");