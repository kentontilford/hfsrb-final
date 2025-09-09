-- Optional PostGIS support for distance queries
-- Safe to run multiple times
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'PostGIS extension requires superuser/privileged role. Skipping.';
END $$;

-- Add geography column if PostGIS is available
DO $$ BEGIN
  PERFORM postgis_version();
  -- We have PostGIS; add geom column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='facility' AND column_name='geom'
  ) THEN
    ALTER TABLE "facility" ADD COLUMN "geom" geography(Point,4326);
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- postgis_version() missing; extension not installed. Skip geom.
  RAISE NOTICE 'PostGIS not installed; skipping geom column.';
END $$;

-- Backfill geom from lat/lng if all present and PostGIS exists
DO $$ BEGIN
  PERFORM postgis_version();
  UPDATE "facility"
  SET "geom" = ST_SetSRID(ST_MakePoint(("lng")::float8, ("lat")::float8), 4326)::geography
  WHERE "geom" IS NULL AND "lat" IS NOT NULL AND "lng" IS NOT NULL;
EXCEPTION WHEN undefined_function THEN
  -- no postgis
  RAISE NOTICE 'PostGIS not installed; skipping geom backfill.';
END $$;

-- Create GIST index on geom if available
DO $$ BEGIN
  PERFORM postgis_version();
  CREATE INDEX IF NOT EXISTS facility_geom_gix ON "facility" USING GIST ("geom");
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'PostGIS not installed; skipping geom index.';
END $$;

