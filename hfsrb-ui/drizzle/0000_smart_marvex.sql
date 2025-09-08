CREATE TABLE "facility" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"county" text,
	"hsa" text,
	"hpa" text,
	"address" jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_esrd_2023" (
	"facility_id" text NOT NULL,
	"year" integer DEFAULT 2023 NOT NULL,
	"stations" integer,
	"shifts" integer,
	"patients_total" integer,
	"incenter_treatments" integer,
	"fte_total" numeric,
	"payer_medicare" numeric,
	"payer_medicaid" numeric,
	"payer_private" numeric,
	"revenue_total" numeric,
	"race_white" numeric,
	"race_black" numeric,
	"race_asian" numeric,
	"race_hispanic" numeric,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "survey_esrd_2023_facility_id_year_pk" PRIMARY KEY("facility_id","year")
);
--> statement-breakpoint
ALTER TABLE "survey_esrd_2023" ADD CONSTRAINT "survey_esrd_2023_facility_id_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facility"("id") ON DELETE cascade ON UPDATE no action;