import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let dbSingleton: any;
try {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  dbSingleton = drizzle(pool);
} catch (e: any) {
  console.error('Database initialization error:', e?.message || e);
  // Fallback stub that throws on use with a clear message
  const err = new Error('Database not configured. Set DATABASE_URL in environment.');
  dbSingleton = new Proxy({}, {
    get() { throw err; }
  });
}

export const db = dbSingleton as any;
