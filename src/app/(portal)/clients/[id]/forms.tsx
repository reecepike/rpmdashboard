"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { addContact, addNote } from "../actions";

export function NoteForm({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(addNote.bind(null, clientId), undefined);

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="note-body" className="sr-only">
        Add a note
      </label>
      <textarea
        id="note-body"
        name="body"
        rows={3}
        placeholder="Log a call, decision or next step…"
        className="field resize-y"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-bad">{state?.errors?.body}</span>
        <Button type="submit" size="sm" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}

export function ContactForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: Parameters<typeof addContact>[1], form: FormData) => {
    const result = await addContact(clientId, prev, form);
    if (result?.ok) setOpen(false);
    return result;
  }, undefined);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)} className="-ml-2">
        <Plus className="size-4" />
        Add contact
      </Button>
    );
  }

  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="c-name" className="eyebrow mb-1.5 block">
          Name
        </label>
        <input id="c-name" name="name" required autoFocus className="field" />
        {e.name && <p className="mt-1 text-xs text-bad">{e.name}</p>}
      </div>
      <div>
        <label htmlFor="c-role" className="eyebrow mb-1.5 block">
          Role
        </label>
        <input id="c-role" name="role" className="field" />
      </div>
      <div>
        <label htmlFor="c-phone" className="eyebrow mb-1.5 block">
          Phone
        </label>
        <input id="c-phone" name="phone" type="tel" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="c-email" className="eyebrow mb-1.5 block">
          Email
        </label>
        <input id="c-email" name="email" type="email" className="field" />
        {e.email && <p className="mt-1 text-xs text-bad">{e.email}</p>}
      </div>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save contact"}
        </Button>
      </div>
    </form>
  );
}
