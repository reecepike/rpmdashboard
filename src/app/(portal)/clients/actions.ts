"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/db";
import { client, clientNote, contact } from "@/db/schema";
import { requireUser } from "@/lib/session";
import {
  contactInput,
  fieldErrors,
  formValues,
  noteInput,
  readClientForm,
  type ClientInput,
} from "@/lib/validation/client";

export type FormState =
  | { errors?: Record<string, string>; values?: Record<string, string | string[]>; ok?: boolean }
  | undefined;

function clientValues(d: ClientInput) {
  return {
    name: d.name,
    status: d.status,
    sector: d.sector,
    services: d.services,
    website: d.website,
    email: d.email,
    phone: d.phone,
    address: d.address,
    town: d.town,
    postcode: d.postcode,
    monthlyRetainerPence: d.monthlyRetainerPence,
    monthlyAdBudgetPence: d.monthlyAdBudgetPence,
    startDate: d.startDate,
  };
}

export async function createClient(_prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = readClientForm(form);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(form) };
  const d = parsed.data;

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(client)
      .values({ ...clientValues(d), ownerId: me.id })
      .returning({ id: client.id });

    if (d.contactName) {
      await tx.insert(contact).values({
        clientId: row.id,
        name: d.contactName,
        role: d.contactRole,
        email: d.contactEmail,
        phone: d.contactPhone,
        isPrimary: true,
      });
    }
    return row.id;
  });

  redirect(`/clients/${id}`);
}

export async function updateClient(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const parsed = readClientForm(form);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(form) };
  const d = parsed.data;

  await db.transaction(async (tx) => {
    const updated = await tx.update(client).set(clientValues(d)).where(eq(client.id, id)).returning({ id: client.id });
    if (!updated.length) throw new Error("Client not found");

    const primary = await tx.query.contact.findFirst({
      where: and(eq(contact.clientId, id), eq(contact.isPrimary, true)),
    });
    const contactData = { name: d.contactName ?? "", role: d.contactRole, email: d.contactEmail, phone: d.contactPhone };

    if (primary && d.contactName) {
      await tx.update(contact).set(contactData).where(eq(contact.id, primary.id));
    } else if (!primary && d.contactName) {
      await tx.insert(contact).values({ ...contactData, clientId: id, isPrimary: true });
    }
  });

  redirect(`/clients/${id}`);
}

export async function setArchived(id: string, archived: boolean) {
  await requireUser();
  await db
    .update(client)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(client.id, id));
  redirect(archived ? "/clients" : `/clients/${id}`);
}

export async function addNote(clientId: string, _prev: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = noteInput.safeParse({ body: form.get("body") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.insert(clientNote).values({ clientId, authorId: me.id, body: parsed.data.body });
  // Touch the client so "last updated" reflects activity
  await db.update(client).set({ updatedAt: new Date() }).where(eq(client.id, clientId));
  refresh();
  return { ok: true };
}

export async function addContact(clientId: string, _prev: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const parsed = contactInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const hasPrimary = await db.query.contact.findFirst({
    where: and(eq(contact.clientId, clientId), eq(contact.isPrimary, true)),
    columns: { id: true },
  });
  await db.insert(contact).values({ ...parsed.data, clientId, isPrimary: !hasPrimary });
  refresh();
  return { ok: true };
}

export async function removeContact(clientId: string, contactId: string) {
  await requireUser();
  await db.delete(contact).where(and(eq(contact.id, contactId), eq(contact.clientId, clientId)));
  refresh();
}

export async function makePrimaryContact(clientId: string, contactId: string) {
  await requireUser();
  await db.transaction(async (tx) => {
    await tx.update(contact).set({ isPrimary: false }).where(eq(contact.clientId, clientId));
    await tx
      .update(contact)
      .set({ isPrimary: true })
      .where(and(eq(contact.id, contactId), eq(contact.clientId, clientId)));
  });
  refresh();
}
