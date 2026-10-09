import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { ClientForm } from "../client-form";
import { createClient } from "../actions";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <>
      <Link href="/clients" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <ArrowLeft className="size-4" />
        Clients
      </Link>
      <PageHeader eyebrow="CRM" title="New client" description="Leads and signed clients both live here — set the status to match." />
      <ClientForm action={createClient} submitLabel="Create client" cancelHref="/clients" />
    </>
  );
}
