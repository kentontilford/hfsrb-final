-- Align DB indexes with app query patterns

-- Facility indexes (filters and ordering)
CREATE INDEX IF NOT EXISTS "facility_by_type" ON "facility" ("type");
CREATE INDEX IF NOT EXISTS "facility_by_hsa" ON "facility" ("hsa");
CREATE INDEX IF NOT EXISTS "facility_by_hpa" ON "facility" ("hpa");
CREATE INDEX IF NOT EXISTS "facility_by_name" ON "facility" ("name");
-- Helpful for spatial filters (non-spatial; consider PostGIS for true geo)
CREATE INDEX IF NOT EXISTS "facility_by_lat_lng" ON "facility" ("lat", "lng");

-- Hospital profile by year: common filters
CREATE INDEX IF NOT EXISTS "hp_by_year_type" ON "hospital_profile_by_year" ("year", "hospital_type");

