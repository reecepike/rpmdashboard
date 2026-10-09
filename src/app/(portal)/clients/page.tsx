import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { clsx } from "clsx";
import { Plus, Search } from "lucide-react";
import { Card, EmptyState, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { getStatusCounts, listClients, parseFilter, type ClientFilter } from "@/lib/data/clients";
import { formatPence, SECTOR_LABEL, SERVICE_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Clients"
        description="Every client and lead, with contacts, services and notes."
        actions={
          <LinkButton href="/clients/new" variant="primary">
            <Plus className="size-4" />
            New client
          </LinkButton>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <ClientList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const TABS: { key: ClientFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "lead", label: "Leads" },
  { key: "paused", label: "Paused" },
  { key: "churned", label: "Churned" },
  { key: "archived", label: "Archived" },
];

async function ClientList({ searchParams }: { searchParams: PageProps<"/clients">["searchParams"] }) {
  const sp = await searchParams;
  const filter = parseFilter(sp.status);
  const q = typeof sp.q === "string" ? sp.q : "";
  const [rows, counts] = await Promise.all([listClients({ q, filter }), getStatusCounts()]);

  const hrefFor = (key: ClientFilter) => {
    const p = new URLSearchParams();
    if (key !== "all") p.set("status", key);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/clients?${s}` : "/clients";
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Filter by status" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {TABS.map((t) => {
            const active = t.key === filter;
            const n = t.key === "archived" ? null : counts[t.key as keyof typeof counts];
            return (
              <Link
                key={t.key}
                href={hrefFor(t.key)}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-[13px] transition-colors",
                  active ? "bg-surface-2 text-text ring-1 ring-line" : "text-muted hover:text-text",
                )}
              >
                {t.label}
                {n != null && <span className="tabular font-mono text-[11px] text-faint">{n}</span>}
              </Link>
            );
          })}
        </nav>

        <form role="search" action="/clients" className="relative md:w-72">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <label htmlFor="q" className="sr-only">
            Search clients
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, town, email" className="field pl-9" />
        </form>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title={q ? `No clients match “${q}”` : "Nothing here yet"}
            body={q ? "Try a different search or filter." : "Add your first client to get started."}
            action={
              !q && (
                <LinkButton href="/clients/new" variant="primary" size="sm">
                  <Plus className="size-4" />
                  New client
                </LinkButton>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="eyebrow px-5 py-3 font-normal">Client</th>
                  <th scope="col" className="eyebrow px-3 py-3 font-normal">Status</th>
                  <th scope="col" className="eyebrow px-3 py-3 font-normal">Services</th>
                  <th scope="col" className="eyebrow px-3 py-3 text-right font-normal">Retainer / mo</th>
                  <th scope="col" className="eyebrow px-5 py-3 text-right font-normal">Ad budget / mo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((c) => (
                  <tr key={c.id} className="group relative hover:bg-surface-2/50">
                    <td className="px-5 py-3.5">
                      <Link href={`/clients/${c.id}`} className="font-medium after:absolute after:inset-0 group-hover:text-accent">
                        {c.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-faint">
                        {[SECTOR_LABEL[c.sector], c.town, c.primaryContact].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-3.5 text-xs text-muted">
                      {c.services.length ? c.services.map((s) => SERVICE_LABEL[s]).join(", ") : "—"}
                    </td>
                    <td className="tabular px-3 py-3.5 text-right">{formatPence(c.monthlyRetainerPence)}</td>
                    <td className="tabular px-5 py-3.5 text-right text-muted">{formatPence(c.monthlyAdBudgetPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <div className="mb-4 flex justify-between">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-10 w-72" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </>
  );
}
