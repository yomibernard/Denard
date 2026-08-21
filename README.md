# Denard — WhatsApp-assisted ecommerce

Premium, mobile-first product catalogue with WhatsApp enquiry ordering. Phase one: discover, filter, enquire. Card checkout is prepared for a later phase.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 7 + **PostgreSQL**
- S3-compatible media uploads (R2/S3) with local fallback for development
- Zustand (enquiry basket, wishlist, compare, recently viewed)
- José JWT sessions for admin auth

## Quick start

```bash
npm install
cp .env.example .env
npm run db:up          # Docker Postgres on localhost:55432
npm run db:setup       # push schema + seed
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Default admin: `admin@denard.co.uk` (set in `.env`) — **change password immediately**

Set WhatsApp digits in `.env` (`NEXT_PUBLIC_WHATSAPP_NUMBER`) or Admin → Settings.

## Production

Live domain: **https://denard.co.uk**

See **[docs/PRODUCTION.md](docs/PRODUCTION.md)** for hosting, secrets, S3/R2 media, and backups.  
Owner day-to-day ops: **[docs/OWNER.md](docs/OWNER.md)**.

## Key customer journeys

1. Browse departments / categories / collections
2. Search, filter, sort on listing pages
3. Open PDP, select options, add to enquiry bag or WhatsApp
4. Submit enquiry → reference (`DEN-2026-000001`) → WhatsApp message
5. Track enquiry status at `/track`

## Admin

Role-based portal for products (categories/collections/variants), catalogue, enquiries, settings, and staff users (create / reset / change password).

## Useful scripts

```bash
npm run merch:photos      # feature photo products; demote SVG placeholders
npm run smoke:enquiry     # DB-level enquiry → WhatsApp URL smoke test
npm run db:jewelry        # jewellery seed extras
```

## Docs

- `docs/PRODUCT.md` — product vision
- `docs/BRAND.md` — brand system
- `docs/OWNER.md` — owner runbook
- `docs/PRODUCTION.md` — deploy & backups
