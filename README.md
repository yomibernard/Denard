# Denard — WhatsApp-assisted ecommerce

Premium, mobile-first product catalogue with WhatsApp enquiry ordering. Phase one: discover, filter, enquire. Payments and full checkout are architected for later phases.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 7 + SQLite (local) — swap to PostgreSQL for production
- Zustand (enquiry basket, wishlist, compare, recently viewed)
- José JWT sessions for admin auth

## Quick start

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Default admin: `admin@denard.com` / `DenardAdmin2026!` (change in `.env`)

Set `WHATSAPP_PHONE` (E.164 without `+`) in `.env` or Admin → Settings.

## Key customer journeys

1. Browse departments / categories / collections (nav from live catalogue)
2. Search, filter, sort on listing pages
3. Open PDP, select options, add to enquiry basket
4. Submit enquiry → unique reference (`DEN-2026-000001`) → WhatsApp message
5. Track enquiry status at `/track`

## Admin

Role-based portal for products, catalogue, enquiries, settings, and users.

## Docs

See `docs/` for architecture, roadmap, security, SEO, analytics, and launch checklist.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:push` | Sync Prisma schema |
| `npm run db:seed` | Seed catalogue + admin users |
| `npm run db:setup` | Push + seed |
| `node scripts/generate-images.mjs` | Regenerate SVG placeholders |
