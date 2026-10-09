/**
 * Demo data for local development. Safe to re-run: wipes CRM tables only (not users).
 *   npm run db:seed
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const clients: Array<{
  name: string;
  sector: schema.Sector;
  status: schema.ClientStatus;
  services: schema.ServiceLine[];
  town: string;
  retainer?: number;
  adBudget?: number;
  contact: { name: string; role: string; email: string; phone: string };
  notes: string[];
}> = [
  {
    name: "Oakwood Interiors",
    sector: "furniture",
    status: "active",
    services: ["meta_ads", "social_content", "direct_mail"],
    town: "Tamworth",
    retainer: 1200,
    adBudget: 2500,
    contact: { name: "Sarah Hale", role: "Owner", email: "sarah@example.com", phone: "01827 000111" },
    notes: ["Autumn sale creative signed off. Launching Monday.", "Asked about adding a radio burst for Black Friday."],
  },
  {
    name: "Brookfield Beds & Sofas",
    sector: "furniture",
    status: "active",
    services: ["meta_ads", "tv", "radio"],
    town: "Burton upon Trent",
    retainer: 1800,
    adBudget: 4000,
    contact: { name: "Mark Ellis", role: "Marketing Manager", email: "mark@example.com", phone: "01283 000222" },
    notes: ["TV slot confirmed for w/c 2 Nov."],
  },
  {
    name: "Greenline Golf Club",
    sector: "golf",
    status: "active",
    services: ["meta_ads", "social_content"],
    town: "Sutton Coldfield",
    retainer: 650,
    adBudget: 800,
    contact: { name: "James Ward", role: "GM", email: "james@example.com", phone: "0121 000 3333" },
    notes: ["Membership drive running until end of month."],
  },
  {
    name: "Hartley Home Store",
    sector: "retail",
    status: "lead",
    services: ["meta_ads"],
    town: "Lichfield",
    contact: { name: "Priya Shah", role: "Director", email: "priya@example.com", phone: "01543 000444" },
    notes: ["Intro call booked. Interested in Meta + direct mail combo."],
  },
  {
    name: "Malvern Furnishings",
    sector: "furniture",
    status: "lead",
    services: ["direct_mail", "meta_ads"],
    town: "Worcester",
    contact: { name: "Tom Reid", role: "Owner", email: "tom@example.com", phone: "01905 000555" },
    notes: [],
  },
  {
    name: "The Linen Loft",
    sector: "retail",
    status: "paused",
    services: ["social_content"],
    town: "Stafford",
    retainer: 500,
    contact: { name: "Claire Moss", role: "Owner", email: "claire@example.com", phone: "01785 000666" },
    notes: ["Paused over summer — revisit in November."],
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db.delete(schema.clientNote);
  await db.delete(schema.contact);
  await db.delete(schema.client);

  const author = await db.query.user.findFirst();

  for (const [i, c] of clients.entries()) {
    const [row] = await db
      .insert(schema.client)
      .values({
        name: c.name,
        sector: c.sector,
        status: c.status,
        services: c.services,
        town: c.town,
        email: c.contact.email,
        phone: c.contact.phone,
        monthlyRetainerPence: c.retainer ? c.retainer * 100 : null,
        monthlyAdBudgetPence: c.adBudget ? c.adBudget * 100 : null,
        startDate: c.status === "lead" ? null : new Date(Date.now() - (i + 2) * 30 * 864e5),
        ownerId: author?.id ?? null,
      })
      .returning();

    await db.insert(schema.contact).values({ clientId: row.id, ...c.contact, isPrimary: true });

    for (const [j, body] of c.notes.entries()) {
      await db.insert(schema.clientNote).values({
        clientId: row.id,
        authorId: author?.id ?? null,
        body,
        createdAt: new Date(Date.now() - (i * 3 + j) * 3600e3 * 7),
      });
    }
  }

  console.log(`Seeded ${clients.length} clients.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
