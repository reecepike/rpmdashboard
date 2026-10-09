import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Globe, Lock, Mail, MapPin, Pencil, Phone, Receipt, Star, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, LinkButton, ModuleAction, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { getClient } from "@/lib/data/clients";
import { formatDate, formatPence, SECTOR_LABEL, SERVICE_LABEL, timeAgo } from "@/lib/format";
import { getModule, type ModuleKey } from "@/config/modules";
import { makePrimaryContact, removeContact, setArchived } from "../actions";
import { ContactForm, NoteForm } from "./forms";

export async function generateMetadata({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const c = await getClient(id);
  return { title: c?.name ?? "Client" };
}

export default function ClientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <>
      <Link href="/clients" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" />
        Clients
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ClientDetail params={params} />
      </Suspense>
    </>
  );
}

const TABS: { label: string; module?: ModuleKey }[] = [
  { label: "Overview" },
  { label: "Quotes", module: "quotes" },
  { label: "Invoices", module: "invoices" },
  { label: "Campaigns", module: "analytics" },
  { label: "Content", module: "content" },
];

async function ClientDetail({ params }: { params: PageProps<"/clients/[id]">["params"] }) {
  const { id } = await params;
  const c = await getClient(id);
  if (!c) notFound();

  const archived = Boolean(c.archivedAt);

  return (
    <>
      <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            {archived && <Badge tone="warn">Archived</Badge>}
            <span className="eyebrow">
              {SECTOR_LABEL[c.sector]}
              {c.town && ` · ${c.town}`}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">{c.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <ModuleAction module="quotes" href={`/quotes/new?client=${c.id}`} icon={<FileText className="size-4" />}>
            New quote
          </ModuleAction>
          <ModuleAction module="invoices" href={`/invoices/new?client=${c.id}`} icon={<Receipt className="size-4" />}>
            New invoice
          </ModuleAction>
          <LinkButton href={`/clients/${c.id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </LinkButton>
          {archived && (
            <form action={setArchived.bind(null, c.id, false)}>
              <Button type="submit" variant="primary">
                Restore
              </Button>
            </form>
          )}
        </div>
      </header>

      {/* Tabs — later modules render locked */}
      <nav aria-label="Client sections" className="mb-8 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          if (!t.module) {
            return (
              <span key={t.label} aria-current="page" className="relative shrink-0 px-3 pb-3 text-sm font-medium">
                {t.label}
                <span className="absolute inset-x-3 -bottom-px h-0.5 bg-accent" aria-hidden />
              </span>
            );
          }
          const mod = getModule(t.module);
          return (
            <span
              key={t.label}
              aria-disabled="true"
              title={`${mod.label} isn't live yet — ${mod.eta}`}
              className="flex shrink-0 cursor-not-allowed items-center gap-1.5 px-3 pb-3 text-sm text-faint"
            >
              <Lock className="size-3" aria-hidden />
              {t.label}
            </span>
          );
        })}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Notes */}
        <Card className="self-start">
          <CardHeader title="Notes" eyebrow={`${c.notes.length} ${c.notes.length === 1 ? "entry" : "entries"}`} />
          <div className="border-b border-line p-5">
            <NoteForm clientId={c.id} />
          </div>
          {c.notes.length === 0 ? (
            <EmptyState title="No notes yet" body="Log calls, decisions and next steps here." />
          ) : (
            <ol className="divide-y divide-line">
              {c.notes.map((n) => (
                <li key={n.id} className="px-5 py-4">
                  <div className="mb-1 flex items-baseline justify-between gap-4 text-xs">
                    <span className="font-medium text-text">{n.author?.name ?? "Unknown"}</span>
                    <time dateTime={n.createdAt.toISOString()} title={n.createdAt.toLocaleString("en-GB")} className="font-mono text-faint">
                      {timeAgo(n.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-muted">{n.body}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          {/* Commercials */}
          <Card>
            <CardHeader title="Commercials" />
            <dl className="grid grid-cols-2 gap-px bg-line">
              <Metric label="Retainer / mo" value={formatPence(c.monthlyRetainerPence)} />
              <Metric label="Ad budget / mo" value={formatPence(c.monthlyAdBudgetPence)} />
            </dl>
            <dl className="divide-y divide-line text-sm">
              <Row label="Client since">{formatDate(c.startDate)}</Row>
              <Row label="Account owner">{c.owner?.name ?? "—"}</Row>
              <Row label="Services">
                {c.services.length ? (
                  <span className="flex flex-wrap justify-end gap-1">
                    {c.services.map((s) => (
                      <Badge key={s}>{SERVICE_LABEL[s]}</Badge>
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </Row>
            </dl>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader title="Business details" />
            <ul className="space-y-3 px-5 py-4 text-sm">
              <Detail icon={<Globe className="size-4" />}>
                {c.website ? (
                  <a href={c.website} target="_blank" rel="noreferrer" className="hover:text-accent">
                    {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                ) : null}
              </Detail>
              <Detail icon={<Mail className="size-4" />}>
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="hover:text-accent">
                    {c.email}
                  </a>
                ) : null}
              </Detail>
              <Detail icon={<Phone className="size-4" />}>
                {c.phone ? (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-accent">
                    {c.phone}
                  </a>
                ) : null}
              </Detail>
              <Detail icon={<MapPin className="size-4" />}>
                {[c.address, c.town, c.postcode].filter(Boolean).join(", ") || null}
              </Detail>
            </ul>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader title="Contacts" eyebrow={`${c.contacts.length}`} />
            {c.contacts.length > 0 && (
              <ul className="divide-y divide-line">
                {c.contacts.map((p) => (
                  <li key={p.id} className="group flex items-start justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0 text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        {p.name}
                        {p.isPrimary && <Badge tone="accent">Primary</Badge>}
                      </div>
                      {p.role && <div className="text-xs text-faint">{p.role}</div>}
                      <div className="mt-1 space-y-0.5 text-xs text-muted">
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="block truncate hover:text-accent">
                            {p.email}
                          </a>
                        )}
                        {p.phone && (
                          <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="block hover:text-accent">
                            {p.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                      {!p.isPrimary && (
                        <form action={makePrimaryContact.bind(null, c.id, p.id)}>
                          <button
                            type="submit"
                            title="Make primary"
                            aria-label={`Make ${p.name} the primary contact`}
                            className="grid size-7 place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-text"
                          >
                            <Star className="size-3.5" />
                          </button>
                        </form>
                      )}
                      <form action={removeContact.bind(null, c.id, p.id)}>
                        <button
                          type="submit"
                          title="Remove contact"
                          aria-label={`Remove ${p.name}`}
                          className="grid size-7 place-items-center rounded-md text-faint hover:bg-bad/10 hover:text-bad"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4">
              <ContactForm clientId={c.id} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="tabular mt-1.5 text-2xl font-semibold tracking-[-0.02em]">{value}</dd>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Detail({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 text-faint">{icon}</span>
      <span className="min-w-0 break-words">{children ?? <span className="text-faint">Not set</span>}</span>
    </li>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="mb-3 h-5 w-40" />
      <Skeleton className="mb-8 h-10 w-80" />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </>
  );
}
