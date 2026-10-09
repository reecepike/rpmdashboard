"use client";

import { useActionState, type ReactNode } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Button, buttonClass } from "@/components/ui";
import { CLIENT_STATUSES, SECTORS, SERVICE_LINES, type ClientStatus, type Sector, type ServiceLine } from "@/lib/constants";
import { SECTOR_LABEL, SERVICE_LABEL, STATUS_LABEL } from "@/lib/format";
import type { FormState } from "./actions";

export type ClientFormDefaults = {
  name?: string;
  status?: ClientStatus;
  sector?: Sector;
  services?: ServiceLine[];
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  town?: string | null;
  postcode?: string | null;
  monthlyRetainer?: string;
  monthlyAdBudget?: string;
  startDate?: string;
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

export function ClientForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  defaults?: ClientFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const e = state?.errors ?? {};

  // After a failed submit, show what the user typed rather than the original defaults.
  const sv = state?.values;
  const v = (field: string, fallback?: string | null) => (sv ? String(sv[field] ?? "") : (fallback ?? ""));
  const services = sv ? ((sv.services as string[] | undefined) ?? []) : (defaults.services ?? []);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {Object.keys(e).length > 0 && (
        <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          Check the highlighted fields.
        </p>
      )}

      <Section title="Business" description="Who they are and where they sit in the book.">
        <Field label="Business name" name="name" error={e.name} className="sm:col-span-2">
          <input id="name" name="name" required defaultValue={v("name", defaults.name)} className="field" autoFocus={!defaults.name} />
        </Field>
        <Field label="Status" name="status" error={e.status}>
          <select key={`status-${v("status", defaults.status ?? "lead")}`} id="status" name="status" defaultValue={v("status", defaults.status ?? "lead")} className="field">
            {CLIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sector" name="sector" error={e.sector}>
          <select key={`sector-${v("sector", defaults.sector ?? "furniture")}`} id="sector" name="sector" defaultValue={v("sector", defaults.sector ?? "furniture")} className="field">
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {SECTOR_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="eyebrow mb-2">Services</legend>
          <div className="flex flex-wrap gap-2">
            {SERVICE_LINES.map((s) => (
              <label key={`${s}-${services.includes(s)}`} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="services"
                  value={s}
                  defaultChecked={services.includes(s)}
                  className="peer sr-only"
                />
                <span className="flex h-8 items-center rounded-full border border-line px-3 text-[13px] text-muted transition-colors peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:border-line-strong">
                  {SERVICE_LABEL[s]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Commercials" description="Monthly figures in pounds. Ad budget is the client's gross budget.">
        <Field label="Monthly retainer (£)" name="monthlyRetainerPence" error={e.monthlyRetainerPence}>
          <input
            id="monthlyRetainerPence"
            name="monthlyRetainerPence"
            inputMode="decimal"
            placeholder="0"
            defaultValue={v("monthlyRetainerPence", defaults.monthlyRetainer)}
            className="field tabular"
          />
        </Field>
        <Field label="Monthly ad budget (£)" name="monthlyAdBudgetPence" error={e.monthlyAdBudgetPence}>
          <input
            id="monthlyAdBudgetPence"
            name="monthlyAdBudgetPence"
            inputMode="decimal"
            placeholder="0"
            defaultValue={v("monthlyAdBudgetPence", defaults.monthlyAdBudget)}
            className="field tabular"
          />
        </Field>
        <Field label="Start date" name="startDate" error={e.startDate}>
          <input id="startDate" name="startDate" type="date" defaultValue={v("startDate", defaults.startDate)} className="field" />
        </Field>
      </Section>

      <Section title="Primary contact" description="The person you deal with day to day.">
        <Field label="Name" name="contactName" error={e.contactName}>
          <input id="contactName" name="contactName" defaultValue={v("contactName", defaults.contactName)} className="field" />
        </Field>
        <Field label="Role" name="contactRole" error={e.contactRole}>
          <input id="contactRole" name="contactRole" placeholder="Owner, Marketing Manager…" defaultValue={v("contactRole", defaults.contactRole)} className="field" />
        </Field>
        <Field label="Email" name="contactEmail" error={e.contactEmail}>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={v("contactEmail", defaults.contactEmail)} className="field" />
        </Field>
        <Field label="Phone" name="contactPhone" error={e.contactPhone}>
          <input id="contactPhone" name="contactPhone" type="tel" defaultValue={v("contactPhone", defaults.contactPhone)} className="field" />
        </Field>
      </Section>

      <Section title="Business details" description="Main store or head office.">
        <Field label="Website" name="website" error={e.website}>
          <input id="website" name="website" placeholder="example.co.uk" defaultValue={v("website", defaults.website)} className="field" />
        </Field>
        <Field label="General email" name="email" error={e.email}>
          <input id="email" name="email" type="email" defaultValue={v("email", defaults.email)} className="field" />
        </Field>
        <Field label="Phone" name="phone" error={e.phone}>
          <input id="phone" name="phone" type="tel" defaultValue={v("phone", defaults.phone)} className="field" />
        </Field>
        <Field label="Address" name="address" error={e.address}>
          <input id="address" name="address" defaultValue={v("address", defaults.address)} className="field" />
        </Field>
        <Field label="Town" name="town" error={e.town}>
          <input id="town" name="town" defaultValue={v("town", defaults.town)} className="field" />
        </Field>
        <Field label="Postcode" name="postcode" error={e.postcode}>
          <input id="postcode" name="postcode" defaultValue={v("postcode", defaults.postcode)} className="field uppercase" />
        </Field>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-line bg-bg/90 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <Link href={cancelHref} className={buttonClass("ghost")}>
          Cancel
        </Link>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 rounded-xl border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={clsx(className, error && "[&_.field]:border-bad")}>
      <label htmlFor={name} className="eyebrow mb-1.5 block">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
