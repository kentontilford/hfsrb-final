-- Add missing columns to facility
DO $$ BEGIN
  ALTER TABLE "facility" ADD COLUMN IF NOT EXISTS "lat" numeric;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "facility" ADD COLUMN IF NOT EXISTS "lng" numeric;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 2024 hospital profile (one row per facility)
CREATE TABLE IF NOT EXISTS "hospital_profile_2024" (
  "facility_id" text PRIMARY KEY REFERENCES "public"."facility"("id") ON DELETE cascade,
  "year" integer NOT NULL DEFAULT 2024,
  "hospital_type" text,
  "ms_con" integer,
  "icu_con" integer,
  "ped_con" integer,
  "obgyn_con" integer,
  "ltc_con" integer,
  "ms_admissions" integer,
  "ms_patient_days" integer,
  "ms_observation_days" integer,
  "race_white" numeric,
  "race_black" numeric,
  "race_native_american" numeric,
  "race_asian" numeric,
  "race_pacific_islander" numeric,
  "race_unknown" numeric,
  "ethnicity_hispanic" numeric,
  "ethnicity_non_hispanic" numeric,
  "ethnicity_unknown" numeric,
  "payer_medicare" numeric,
  "payer_medicaid" numeric,
  "payer_private" numeric,
  "payer_other_public" numeric,
  "payer_private_pay" numeric,
  "payer_charity" numeric,
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "hp2024_by_type" ON "hospital_profile_2024" ("hospital_type");

-- Unified hospital profile by year (composite PK)
CREATE TABLE IF NOT EXISTS "hospital_profile_by_year" (
  "facility_id" text NOT NULL REFERENCES "public"."facility"("id") ON DELETE cascade,
  "year" integer NOT NULL,
  "hospital_type" text,
  "ms_con" integer,
  "icu_con" integer,
  "ped_con" integer,
  "obgyn_con" integer,
  "ltc_con" integer,
  "ms_admissions" integer,
  "ms_patient_days" integer,
  "ms_observation_days" integer,
  "race_white" numeric,
  "race_black" numeric,
  "race_native_american" numeric,
  "race_asian" numeric,
  "race_pacific_islander" numeric,
  "race_unknown" numeric,
  "ethnicity_hispanic" numeric,
  "ethnicity_non_hispanic" numeric,
  "ethnicity_unknown" numeric,
  "payer_medicare" numeric,
  "payer_medicaid" numeric,
  "payer_private" numeric,
  "payer_other_public" numeric,
  "payer_private_pay" numeric,
  "payer_charity" numeric,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "hospital_profile_by_year_pk" PRIMARY KEY ("facility_id","year")
);
CREATE INDEX IF NOT EXISTS "hp_by_year" ON "hospital_profile_by_year" ("year");
CREATE INDEX IF NOT EXISTS "hp_by_type" ON "hospital_profile_by_year" ("hospital_type");

-- HSA/HPA summaries for 2024
CREATE TABLE IF NOT EXISTS "hsa_summary_2024" (
  "hsa" text PRIMARY KEY,
  "total_hospitals" integer,
  "critical_access" integer,
  "acute_ltc" integer,
  "general" integer,
  "psychiatric" integer,
  "rehabilitation" integer,
  "childrens" integer,
  "ms_con" integer,
  "icu_con" integer,
  "ped_con" integer,
  "obgyn_con" integer,
  "ltc_con" integer,
  "ms_admissions" integer,
  "ms_patient_days" integer,
  "ms_observation_days" integer,
  "race_white" numeric,
  "race_black" numeric,
  "race_native_american" numeric,
  "race_asian" numeric,
  "race_pacific_islander" numeric,
  "race_unknown" numeric,
  "ethnicity_hispanic" numeric,
  "ethnicity_non_hispanic" numeric,
  "ethnicity_unknown" numeric,
  "payer_medicare" numeric,
  "payer_medicaid" numeric,
  "payer_private" numeric,
  "payer_other_public" numeric,
  "payer_private_pay" numeric,
  "payer_charity" numeric,
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "hpa_summary_2024" (
  "hpa" text PRIMARY KEY,
  "total_hospitals" integer,
  "critical_access" integer,
  "acute_ltc" integer,
  "general" integer,
  "psychiatric" integer,
  "rehabilitation" integer,
  "childrens" integer,
  "ms_con" integer,
  "icu_con" integer,
  "ped_con" integer,
  "obgyn_con" integer,
  "ltc_con" integer,
  "ms_admissions" integer,
  "ms_patient_days" integer,
  "ms_observation_days" integer,
  "race_white" numeric,
  "race_black" numeric,
  "race_native_american" numeric,
  "race_asian" numeric,
  "race_pacific_islander" numeric,
  "race_unknown" numeric,
  "ethnicity_hispanic" numeric,
  "ethnicity_non_hispanic" numeric,
  "ethnicity_unknown" numeric,
  "payer_medicare" numeric,
  "payer_medicaid" numeric,
  "payer_private" numeric,
  "payer_other_public" numeric,
  "payer_private_pay" numeric,
  "payer_charity" numeric,
  "updated_at" timestamp with time zone DEFAULT now()
);

-- Yearly summaries
CREATE TABLE IF NOT EXISTS "hsa_summary_by_year" (
  "hsa" text NOT NULL,
  "year" integer NOT NULL,
  "total_hospitals" integer,
  "critical_access" integer,
  "acute_ltc" integer,
  "general" integer,
  "psychiatric" integer,
  "rehabilitation" integer,
  "childrens" integer,
  "ms_con" integer,
  "icu_con" integer,
  "ped_con" integer,
  "obgyn_con" integer,
  "ltc_con" integer,
  "ms_admissions" integer,
  "ms_patient_days" integer,
  "ms_observation_days" integer,
  "race_white" numeric,
  "race_black" numeric,
  "race_native_american" numeric,
  "race_asian" numeric,
  "race_pacific_islander" numeric,
  "race_unknown" numeric,
  "ethnicity_hispanic" numeric,
  "ethnicity_non_hispanic" numeric,
  "ethnicity_unknown" numeric,
  "payer_medicare" numeric,
  "payer_medicaid" numeric,
  "payer_private" numeric,
  "payer_other_public" numeric,
  "payer_private_pay" numeric,
  "payer_charity" numeric,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "hsa_summary_by_year_pk" PRIMARY KEY ("hsa","year")
);
CREATE INDEX IF NOT EXISTS "hsa_sum_by_year" ON "hsa_summary_by_year" ("year");

CREATE TABLE IF NOT EXISTS "hpa_summary_by_year" (
  "hpa" text NOT NULL,
  "year" integer NOT NULL,
  "total_hospitals" integer,
  "critical_access" integer,
  "acute_ltc" integer,
  "general" integer,
  "psychiatric" integer,
  "rehabilitation" integer,
  "childrens" integer,
  "ms_con" integer,
  "icu_con" integer,
  "ped_con" integer,
  "obgyn_con" integer,
  "ltc_con" integer,
  "ms_admissions" integer,
  "ms_patient_days" integer,
  "ms_observation_days" integer,
  "race_white" numeric,
  "race_black" numeric,
  "race_native_american" numeric,
  "race_asian" numeric,
  "race_pacific_islander" numeric,
  "race_unknown" numeric,
  "ethnicity_hispanic" numeric,
  "ethnicity_non_hispanic" numeric,
  "ethnicity_unknown" numeric,
  "payer_medicare" numeric,
  "payer_medicaid" numeric,
  "payer_private" numeric,
  "payer_other_public" numeric,
  "payer_private_pay" numeric,
  "payer_charity" numeric,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "hpa_summary_by_year_pk" PRIMARY KEY ("hpa","year")
);
CREATE INDEX IF NOT EXISTS "hpa_sum_by_year" ON "hpa_summary_by_year" ("year");

-- Bed inventory history
CREATE TABLE IF NOT EXISTS "bed_inventory" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "facility_id" text NOT NULL REFERENCES "public"."facility"("id") ON DELETE cascade,
  "bed_type" text NOT NULL,
  "authorised_beds" integer NOT NULL,
  "effective_date" date NOT NULL,
  "entered_at" timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "bed_by_facility_type_date" ON "bed_inventory" ("facility_id","bed_type","effective_date");

