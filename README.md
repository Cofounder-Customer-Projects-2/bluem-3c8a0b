# Cofounder Product Template

This repository was provisioned by Cofounder as a product app scaffold. It is
designed to run on day one without Supabase configured, while still carrying
ready-to-enable auth, payments, and email scaffolding for when you need them.

## What is included

- Bun with exact package versions and a committed `bun.lock`.
- Next.js App Router, React 19, and strict TypeScript.
- Tailwind CSS v4 with a Cofounder-inspired starter interface.
- TanStack Query wired at the app root.
- Supabase SSR client helpers, auth callback route, and session proxy helper.
- Stripe webhook route scaffolding.
- Postmark transactional email helpers and starter template definitions.
- A waitlist server action that shows how to send email from the app.
- A `next-themes` light and dark theme switcher.
- Biome for linting and formatting.

## Run locally

```bash
bun install
bun dev
```

`bun dev` works before Supabase exists. The seeded landing page is intentionally
public and the default `src/proxy.ts` returns `NextResponse.next()` so the first
local run does not require auth infrastructure.

## Enable Supabase when you are ready

1. Create a Supabase project.
2. Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Open `src/proxy.ts`.
4. Uncomment the `updateSession` import and `return updateSession(request)`.
5. Remove the placeholder `return NextResponse.next({ request })`.

The auth callback route at `src/app/auth/callback/route.ts` is already wired for
Supabase OAuth redirects once those environment variables and the proxy call are
enabled.

## Enable payments and email

Stripe webhooks use `src/app/api/stripe/webhook/route.ts`. Add these values when
you are ready to receive webhook events:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Postmark helpers live under `src/lib/postmark/`. Add these values when you are
ready to send email:

```bash
POSTMARK_SERVER_TOKEN=
POSTMARK_SERVER_ID=
POSTMARK_MESSAGE_STREAM=outbound
POSTMARK_BROADCAST_MESSAGE_STREAM=broadcasts
POSTMARK_FROM_EMAIL=
```

## Where to edit

- `src/app/page.tsx` owns the placeholder product landing page.
- `src/app/globals.css` owns the design tokens and page-level styling.
- `src/components/theme-toggle.tsx` owns the light and dark mode control.
- `src/lib/supabase/` contains Supabase browser, server, admin, and proxy helpers.
- `src/actions/waitlist.ts` is the starter server action for collecting intent.

## Next steps

1. Replace the placeholder product copy and layout in `src/app/page.tsx`.
2. Add authenticated product routes under `src/app/`.
3. Configure Supabase when you are ready for auth and persisted user data.
4. Configure Stripe and Postmark when payments and email become part of the flow.
5. Run `bun run lint`, `bun run typecheck`, and `bun run build` before shipping.
