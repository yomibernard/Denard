# Denard production setup

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js on Vercel, Railway, Render, or a VPS |
| Database | **PostgreSQL** (required) |
| Media | S3-compatible object storage (AWS S3, Cloudflare R2, or MinIO) |
| Chat | WhatsApp click-to-chat (`wa.me`) via env + Admin settings |
| Email (optional) | Resend — staff alert when a new enquiry is created |

SQLite is no longer supported for Denard.

## 1. Local Postgres

```bash
npm run db:up          # Docker Postgres (default host port 55432)
npm run db:migrate     # or: npx prisma db push
npm run db:seed
npm run db:jewelry     # optional jewellery catalogue
npm run merch:photos
npm run dev
```

Default local URL:

```env
DATABASE_URL="postgresql://denard:denard@localhost:55432/denard?schema=public"
```

## 2. Production environment

Set these on your host:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/denard?schema=public&sslmode=require"
NEXT_PUBLIC_SITE_URL="https://denard.co.uk"
NEXT_PUBLIC_WHATSAPP_NUMBER="447887539426"
WHATSAPP_PHONE="447887539426"
AUTH_SECRET="<32+ random characters>"
ADMIN_DEFAULT_EMAIL="admin@denard.co.uk"
ADMIN_DEFAULT_PASSWORD="<strong temporary password>"
```

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Durable media (required for real hosting)

Without S3/R2, uploads land in `public/uploads` and **will be lost** on ephemeral hosts.

```env
S3_BUCKET="denard-media"
S3_REGION="auto"
S3_ENDPOINT="https://<accountid>.r2.cloudflarestorage.com"
S3_FORCE_PATH_STYLE="true"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_PUBLIC_BASE_URL="https://media.denard.co.uk"
```

### Optional Stripe card payments

When configured, staff can create a Stripe Checkout link from an enquiry and send it on WhatsApp. Payment confirmation updates the enquiry via webhook.

```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Webhook URL: `https://denard.co.uk/api/stripe/webhook`  
Subscribe to: `checkout.session.completed`, `checkout.session.expired`.

Phase note: the storefront stays WhatsApp-first. Card checkout is staff-triggered per enquiry, not an on-site cart.

## 3. Deploy checklist

1. Provision managed Postgres (Neon, Supabase, Railway, AWS RDS, Prisma Postgres, etc.).
2. Configure object storage + public CDN/base URL.
3. Set all env vars; never commit `.env`.
4. Run `npx prisma migrate deploy` then seed if the database is empty.
5. Change the admin password immediately (`/admin` → Users).
6. Confirm WhatsApp number in Admin → Settings.
7. Hit `GET /api/health` — expect `"ok": true` and `"database": "up"`.
8. Run the smoke checklist in `docs/OWNER.md` and `npm run smoke:enquiry` against staging.
9. Place one real phone enquiry end-to-end.

### Vercel (example)

1. Import the GitHub repo into Vercel.
2. Set env vars from section 2 (including `DATABASE_URL` and `AUTH_SECRET`).
3. Build uses `vercel.json` (`prisma generate && next build`).
4. After first deploy, run migrations once from CI or a one-off:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. Attach **denard.co.uk** (and optionally `www.denard.co.uk` → apex redirect) in the host DNS settings; set `NEXT_PUBLIC_SITE_URL=https://denard.co.uk` and redeploy.

### Railway / Render / VPS

- Start command: `npx prisma migrate deploy && npm run start` (after `npm run build`).
- Bind to the host’s required port (`PORT` env).
- Point health checks at `/api/health`.

## 4. Backups

- **Database:** enable automated daily backups on your Postgres provider; keep at least 7–14 days.
- **Media:** enable versioning / replication on the bucket.
- Quarterly: download a CSV of enquiries (Admin → Enquiries → Export) as a business archive.

## 5. Migrations

Local / first setup:

```bash
npm run db:up
npx prisma db push          # or: npm run db:migrate
npm run db:seed
```

Production deploys (preferred):

```bash
npx prisma migrate deploy
```

Never run destructive reset commands against production.

## 6. Hosting notes (Next.js)

- Prefer a Node host that supports the App Router and server routes (`/api/*`).
- Admin UI and `/api/admin/*` are gated by `src/proxy.ts` + JWT session cookie.
- Set `NEXT_PUBLIC_SITE_URL=https://denard.co.uk` so WhatsApp messages contain correct product links.
- After DNS cutover, re-test one full enquiry on a real phone.
- Monitor `/api/health` from your uptime provider.
