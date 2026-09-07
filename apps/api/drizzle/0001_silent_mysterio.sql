CREATE TYPE "public"."location_type" AS ENUM('ZONE', 'RACK', 'AREA', 'REPAIR', 'INSPECTION', 'DISPATCH', 'SCRAP');--> statement-breakpoint
CREATE TYPE "public"."cylinder_availability_status" AS ENUM('AVAILABLE', 'RESERVED', 'WITH_CUSTOMER', 'IN_TRANSIT', 'BLOCKED', 'SCRAPPED');--> statement-breakpoint
CREATE TYPE "public"."cylinder_condition_status" AS ENUM('GOOD', 'DAMAGED', 'NEEDS_INSPECTION', 'UNDER_REPAIR', 'REPAIRED', 'SCRAPPED');--> statement-breakpoint
CREATE TABLE "warehouse_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"parent_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"location_type" "location_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cylinder_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"capacity_kg" numeric(6, 2) NOT NULL,
	"brand" text,
	"description" text,
	"deposit_amount" numeric(12, 2),
	"default_price" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cylinder_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cylinders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cylinder_type_id" uuid NOT NULL,
	"internal_code" text NOT NULL,
	"serial_number" text NOT NULL,
	"qr_code" text,
	"barcode" text,
	"manufacture_date" date,
	"purchase_date" date,
	"availability_status" "cylinder_availability_status" DEFAULT 'AVAILABLE' NOT NULL,
	"condition_status" "cylinder_condition_status" DEFAULT 'GOOD' NOT NULL,
	"current_warehouse_id" uuid,
	"current_location_id" uuid,
	"current_customer_id" uuid,
	"last_inspection_at" timestamp with time zone,
	"next_inspection_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cylinders_internalCode_unique" UNIQUE("internal_code"),
	CONSTRAINT "cylinders_serialNumber_unique" UNIQUE("serial_number"),
	CONSTRAINT "cylinders_qrCode_unique" UNIQUE("qr_code"),
	CONSTRAINT "cylinders_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"tax_number" text,
	"contact_person" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_locations" ADD CONSTRAINT "warehouse_locations_parent_id_warehouse_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cylinders" ADD CONSTRAINT "cylinders_cylinder_type_id_cylinder_types_id_fk" FOREIGN KEY ("cylinder_type_id") REFERENCES "public"."cylinder_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cylinders" ADD CONSTRAINT "cylinders_current_warehouse_id_warehouses_id_fk" FOREIGN KEY ("current_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cylinders" ADD CONSTRAINT "cylinders_current_location_id_warehouse_locations_id_fk" FOREIGN KEY ("current_location_id") REFERENCES "public"."warehouse_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "warehouse_locations_warehouse_code_idx" ON "warehouse_locations" USING btree ("warehouse_id","code");