import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, PageHeader, Skeleton } from "@/components/ui";
import { getClient } from "@/lib/data/clients";
import { ClientForm } from "../../client-form";
import { setArchived, updateClient } from "../../actions";

export const metadata = { title: "Edit client" };

export default function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-[600px] rounded-xl" />}>
      <EditClient params={params} />
    </Suspense>
  );
}

const pounds = (pence: number | null) => (pence == null ? "" : String(pence / 100));

async function EditClient({ params }: { params: PageProps<"/clients/[id]/edit">["params"] }) {
  const { id } = await params;
  const c = await getClient(id);
  if (!c) notFound();

  const primary = c.contacts.find((p) => p.isPrimary);

  return (
    <>
      <Link href={`/clients/${c.id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" />
        {c.name}
      </Link>
      <PageHeader eyebrow="Edit client" title={c.name} />
      <ClientForm
        action={updateClient.bind(null, c.id)}
        submitLabel="Save changes"
        cancelHref={`/clients/${c.id}`}
        defaults={{
          name: c.name,
          status: c.status,
          sector: c.sector,
          services: c.services,
          website: c.website,
          email: c.email,
          phone: c.phone,
          address: c.address,
          town: c.town,
          postcode: c.postcode,
          monthlyRetainer: pounds(c.monthlyRetainerPence),
          monthlyAdBudget: pounds(c.monthlyAdBudgetPence),
          startDate: c.startDate?.toISOString().slice(0, 10),
          contactName: primary?.name,
          contactRole: primary?.role,
          contactEmail: primary?.email,
          contactPhone: primary?.phone,
        }}
      />

      {!c.archivedAt && (
        <section className="mt-10 flex flex-col gap-4 rounded-xl border border-bad/25 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Archive client</h2>
            <p className="mt-1 text-xs text-muted">Hides them from lists and the dashboard. Notes and contacts are kept — restore any time.</p>
          </div>
          <form action={setArchived.bind(null, c.id, true)}>
            <Button type="submit" variant="danger">
              Archive
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
