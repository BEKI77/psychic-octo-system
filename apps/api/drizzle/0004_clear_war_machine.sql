CREATE TYPE "public"."inspection_result" AS ENUM('GOOD', 'DAMAGED', 'NEEDS_REPAIR');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('DRAFT', 'RECEIVED', 'INSPECTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('REPORTED', 'IN_REPAIR', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('REPAIR', 'OTHER');--> statement-breakpoint
CREATE SEQUENCE "public"."return_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."maintenance_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"sale_item_id" uuid NOT NULL,
	"cylinder_id" uuid NOT NULL,
	"condition_at_return" "cylinder_condition_status" NOT NULL,
	"inspection_result" "inspection_result",
	"financial_adjustment" numeric(12, 2),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_number" text DEFAULT ('RET-' || lpad(nextval('return_number_seq')::text, 6, '0')) NOT NULL,
	"customer_id" uuid NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"return_date" date NOT NULL,
	"status" "return_status" DEFAULT 'DRAFT' NOT NULL,
	"total_items" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"received_by" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "returns_returnNumber_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_number" text DEFAULT ('MNT-' || lpad(nextval('maintenance_number_seq')::text, 6, '0')) NOT NULL,
	"cylinder_id" uuid NOT NULL,
	"maintenance_type" "maintenance_type" DEFAULT 'REPAIR' NOT NULL,
	"description" text,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cost" numeric(12, 2),
	"status" "maintenance_status" DEFAULT 'REPORTED' NOT NULL,
	"performed_by" uuid,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_records_maintenanceNumber_unique" UNIQUE("maintenance_number")
);
--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_cylinder_id_cylinders_id_fk" FOREIGN KEY ("cylinder_id") REFERENCES "public"."cylinders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_cylinder_id_cylinders_id_fk" FOREIGN KEY ("cylinder_id") REFERENCES "public"."cylinders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;