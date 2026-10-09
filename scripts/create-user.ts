/**
 * Create (or reset the password of) a portal user.
 *
 *   npm run user:create -- --email reece@rpmgroup.co.uk --name "Reece Pike" --password "..." --role admin
 *
 * Public sign-up is disabled, so this is the only way in.
 */
import { parseArgs } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import * as schema from "../src/db/schema";
import { createId } from "../src/lib/id";

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      password: { type: "string" },
      role: { type: "string", default: "staff" },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const { name, password, role } = values;
  if (!email || !name || !password) {
    console.error('Usage: npm run user:create -- --email x@y.com --name "Full Name" --password "..." [--role admin|staff]');
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }
  if (role !== "admin" && role !== "staff") {
    console.error('Role must be "admin" or "staff".');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const hash = await hashPassword(password);

  const existing = await db.query.user.findFirst({ where: eq(schema.user.email, email) });

  if (existing) {
    await db.update(schema.user).set({ name, role }).where(eq(schema.user.id, existing.id));
    await db
      .update(schema.account)
      .set({ password: hash })
      .where(and(eq(schema.account.userId, existing.id), eq(schema.account.providerId, "credential")));
    console.log(`Updated ${email} (${role}).`);
  } else {
    const id = createId();
    await db.insert(schema.user).values({ id, email, name, role, emailVerified: true });
    await db.insert(schema.account).values({
      id: createId(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hash,
    });
    console.log(`Created ${email} (${role}).`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
