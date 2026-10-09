import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, FileText, Lock, Plus, Receipt } from "lucide-react";
import { Card, CardHeader, EmptyState, LinkButton, ModuleAction, PageHeader, Skeleton } from "@/components/ui";
import { getDashboardStats } from "@/lib/data/clients";
import { requireUser } from "@/lib/session";
import { formatPence, SECTOR_LABEL, timeAgo } from "@/lib/format";
import { getModule, type ModuleKey } from "@/config/modules";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow={<Suspense fallback="Overview">{<Greeting />}</Suspense>}
        title="Dashboard"
        actions={
          <>
            <ModuleAction module="quotes" href="/quotes/new" icon={<FileText className="size-4" />}>
              New quote
            </ModuleAction>
            <ModuleAction module="invoices" href="/invoices/new" icon={<Receipt className="size-4" />}>
              New invoice
            </ModuleAction>
            <LinkButton href="/clients/new" variant="primary">
              <Plus className="size-4" />
              New client
            </LinkButton>
          </>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody />
      </Suspense>
    </>
  );
}

async function Greeting() {
  const user = await requireUser();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", timeZone: "Europe/London" }).format(new Date()));
  const part = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  return `${part}, ${user.name.split(" ")[0]}`;
}

async function DashboardBody() {
  const s = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        <Stat label="Active clients" value={String(s.active)} href="/clients?status=active" />
        <Stat label="Monthly retainers" value={formatPence(s.retainerPence)} sub="Active clients" />
        <Stat label="Ad budget managed" value={formatPence(s.adBudgetPence)} sub="Per month, gross" />
        <Stat label="Open leads" value={String(s.leads)} href="/clients?status=lead" />
      </section>

      {/* Locked KPIs — light up as modules ship */}
      <section aria-label="Coming soon" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <LockedStat module="quotes" label="Quotes awaiting sign-off" />
        <LockedStat module="invoices" label="Invoices overdue" />
        <LockedStat module="analytics" label="Blended CPL · 30 days" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Latest activity" eyebrow="Client notes" />
          {s.recentNotes.length === 0 ? (
            <EmptyState title="No notes yet" body="Notes added on a client page show up here." />
          ) : (
            <ul className="divide-y divide-line">
              {s.recentNotes.map((n) => (
                <li key={n.id}>
                  <Link href={`/clients/${n.clientId}`} className="group block px-5 py-3.5 hover:bg-surface-2/50">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-medium group-hover:text-accent">{n.clientName}</span>
                      <span className="shrink-0 font-mono text-[11px] text-faint">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.body}</p>
                    {n.authorName && <p className="mt-1 text-xs text-faint">{n.authorName}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Newest leads"
              eyebrow="Pipeline"
              action={
                <Link href="/clients?status=lead" className="text-xs text-muted hover:text-text">
                  View all
                </Link>
              }
            />
            {s.newestLeads.length === 0 ? (
              <EmptyState title="No open leads" />
            ) : (
              <ul className="divide-y divide-line">
                {s.newestLeads.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/clients/${l.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-surface-2/50"
                    >
                      <span className="truncate">{l.name}</span>
                      <span className="shrink-0 text-xs text-faint">{l.town ?? "—"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Active by sector" eyebrow="Book of business" />
            {s.bySector.length === 0 ? (
              <EmptyState title="No active clients yet" />
            ) : (
              <SectorBars rows={s.bySector} total={s.active} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <>
      <div className="eyebrow flex items-center justify-between">
        {label}
        {href && <ArrowUpRight className="size-3.5 text-faint transition-colors group-hover:text-accent" aria-hidden />}
      </div>
      <div className="tabular mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-faint">{sub}</div>}
    </>
  );
  const cls = "group block bg-surface p-5";
  return href ? (
    <Link href={href} className={`${cls} hover:bg-surface-2/60`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function LockedStat({ module, label }: { module: ModuleKey; label: string }) {
  const mod = getModule(module);
  return (
    <div
      aria-disabled="true"
      className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-line px-5 py-4 text-faint"
    >
      <div>
        <div className="eyebrow text-faint">{label}</div>
        <div className="mt-1 text-xs">Unlocks with {mod.label}</div>
      </div>
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
        <Lock className="size-3" aria-hidden />
        {mod.eta}
      </span>
    </div>
  );
}

function SectorBars({ rows, total }: { rows: { sector: keyof typeof SECTOR_LABEL; n: number }[]; total: number }) {
  return (
    <ul className="space-y-3 px-5 py-4">
      {rows.map((r) => {
        const pct = total ? Math.round((r.n / total) * 100) : 0;
        return (
          <li key={r.sector}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{SECTOR_LABEL[r.sector]}</span>
              <span className="tabular text-muted">{r.n}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
