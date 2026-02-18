
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Aiven and some other providers use self-signed certificates.
// This allows connecting even if the certificate is not from a known authority.
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("aiven") || process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : false
});
export const db = drizzle(pool, { schema });
