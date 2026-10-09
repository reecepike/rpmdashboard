import { defineConfig } from "drizzle-kit";

// Load .env locally (on Vercel/CI the env vars are already set)
try {
  process.loadEnvFile(".env");
} catch {}

// Migrations run against the DIRECT (non-pooled) Neon connection.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
});
