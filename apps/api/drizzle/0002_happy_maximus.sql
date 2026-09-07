CREATE TYPE "public"."receipt_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."inventory_transaction_type" AS ENUM('RECEIVE', 'ISSUE', 'RETURN', 'TRANSFER', 'MOVE', 'INSPECTION', 'REPAIR_START', 'REPAIR_COMPLETE', 'DAMAGE', 'SCRAP', 'ADJUSTMENT');--> statement-breakpoint
CREATE SEQUENCE "public"."receipt_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."transaction_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "receipt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"cylinder_id" uuid NOT NULL,
	"location_id" uuid,
	"condition_status" "cylinder_condition_status" DEFAULT 'GOOD' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_number" text DEFAULT ('RCPT-' || lpad(nextval('receipt_number_seq')::text, 6, '0')) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"supplier_reference" text,
	"received_date" date NOT NULL,
	"status" "receipt_status" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_receiptNumber_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_number" text DEFAULT ('TXN-' || lpad(nextval('transaction_number_seq')::text, 6, '0')) NOT NULL,
	"cylinder_id" uuid NOT NULL,
	"transaction_type" "inventory_transaction_type" NOT NULL,
	"from_warehouse_id" uuid,
	"from_location_id" uuid,
	"from_customer_id" uuid,
	"to_warehouse_id" uuid,
	"to_location_id" uuid,
	"to_customer_id" uuid,
	"reference_type" text,
	"reference_id" uuid,
	"condition_before" "cylinder_condition_status",
	"condition_after" "cylinder_condition_status",
	"performed_by" uuid NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_transactions_transactionNumber_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_cylinder_id_cylinders_id_fk" FOREIGN KEY ("cylinder_id") REFERENCES "public"."cylinders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_location_id_warehouse_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_cylinder_id_cylinders_id_fk" FOREIGN KEY ("cylinder_id") REFERENCES "public"."cylinders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_from_location_id_warehouse_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_to_location_id_warehouse_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_transactions_cylinder_id_idx" ON "inventory_transactions" USING btree ("cylinder_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_reference_idx" ON "inventory_transactions" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "inventory_transactions_type_date_idx" ON "inventory_transactions" USING btree ("transaction_type","transaction_date");