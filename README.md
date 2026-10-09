# RPM Portal

Internal operations portal for RPM Group. Next.js 16 · Drizzle ORM · Neon Postgres · Better Auth · Tailwind 4.

**Live now:** sign-in, Dashboard, Clients (CRM: clients, contacts, notes, archive).
**Locked:** Pipeline, Quotes, Invoices, Analytics, Content, Website, Settings. They show in the nav and as buttons, but can't be clicked, and their URLs 404.

## Switching a module on

All modules live in `src/config/modules.ts`. When one is built:

1. Build its routes under `src/app/(portal)/<module>/`.
2. Set `enabled: true` for it in `modules.ts`.

The nav item, dashboard tile, client-page tab and any `<ModuleAction module="...">` buttons unlock automatically.

## Local setup

```bash
npm install
cp .env.example .env          # fill in Neon + auth values
npm run db:migrate            # create tables
npm run user:create -- --email you@rpmgroup.co.uk --name "Your Name" --password "min-10-chars" --role admin
npm run db:seed               # optional demo clients (wipes CRM tables)
npm run dev
```

Public sign-up is off. `user:create` is the only way to add a user, and re-running it for an existing email resets that user's password.

## Database changes

1. Edit `src/db/schema.ts`.
2. Run `npm run db:generate` to write a SQL migration into `/drizzle`. Commit it.
3. Run `npm run db:migrate` to apply it.
4. Run `npm run db:studio` to browse the data.

Money is stored in **pence** as integers. Use `formatPence()` and `parsePounds()` from `src/lib/format.ts`.

## Deploying (GitHub → Vercel → Neon)

1. Push the repo to GitHub on your **personal** account. Vercel Hobby can't deploy private org repos.
2. In Vercel, import the repo and add the Neon integration. It sets `DATABASE_URL` and creates a DB branch per preview.
3. Add these env vars: `DIRECT_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` (production domain).
4. Set the function region to London (`lhr1`) and the Neon region to `eu-west-2`.
5. Run migrations against production with `DIRECT_URL=... npm run db:migrate`.

Move Vercel to Pro before real clients or payments touch it.

## Structure

```
src/
  app/
    login/                 sign-in page
    (portal)/              everything behind auth
      page.tsx             dashboard
      clients/             list, new, [id], [id]/edit, server actions
    api/auth/[...all]/     Better Auth handler
  config/modules.ts        module registry + lock flags
  db/                      Drizzle schema + client
  lib/
    auth.ts, session.ts    auth config, requireUser()
    data/                  data access layer (every read checks the session)
    validation/            zod schemas for forms
  components/              UI kit, sidebar, user menu
  proxy.ts                 redirects signed-out users to /login
scripts/                   create-user, seed
```

## Notes

- Cache Components is on, which is Next 16's model. Anything reading the session or the DB sits inside `<Suspense>`.
- Every server action calls `requireUser()`. Do the same in new actions; don't rely on the proxy for auth.
- Sign-in is rate-limited by Better Auth to 3 attempts per 10 seconds.
