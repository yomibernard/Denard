# Denard product documentation

## 1. Product model

| ID | Assumption | Status |
|----|------------|--------|
| A1 | Card checkout + WhatsApp | Active — customers can **Pay by card** from Your bag when Stripe is configured; WhatsApp remains an alternative. Staff payment links still work. |
| A2 | PostgreSQL only | Active — SQLite is not supported |
| A3 | WhatsApp via env + Admin → Settings | Active |
| A4 | Catalogue navigation is DB-driven | Active |
| A5 | Live jewellery uses real photos (R2/CDN) | Active — avoid SVG placeholders for published jewellery |
| A6 | Moderated product reviews on PDPs | Active |
| A7 | Multi-currency / i18n deferred | Schema has `currency` for later |

## 2. Architecture

```
Browser → Next.js App Router (Vercel)
  ├─ (shop) storefront + /api/checkout (Stripe)
  ├─ admin portal (JWT cookie, ~8h session)
  └─ API routes (/api/enquiries, /api/stripe/webhook, /api/admin/*)
         ↓
     Prisma ORM → Neon PostgreSQL
         ↓
     Cloudflare R2 (product media)
```

Operating guides: `docs/OWNER.md` (business), `docs/PRODUCTION.md` (hosting).

## 3. Security

- Admin passwords bcrypt; login lockout after failed attempts
- HTTP-only JWT cookies (~8 hours)
- Role-based nav + API checks via `ROLE_PERMISSIONS`
- Rate limits on public forms; optional Cloudflare Turnstile
- Security headers + CSP on responses
- Privacy request workflow in Admin → Privacy
- Audit log for key mutations
- Stripe Checkout hosted pages (card data never touches Denard servers)

## 4. Launch checklist (owner + developer)

- [x] Production `AUTH_SECRET`, WhatsApp number, `NEXT_PUBLIC_SITE_URL=https://denard.co.uk`
- [x] Managed PostgreSQL (Neon) + migrations
- [x] Durable media (Cloudflare R2) with correct `S3_PUBLIC_BASE_URL` (include `/denard-media` on r2.dev hosts)
- [x] HTTPS + security headers
- [x] Owner runbook (`docs/OWNER.md`)
- [x] Phase 3 on-site card checkout (`/api/checkout`, bag **Pay by card**)
- [ ] Change default admin password after first login
- [ ] Confirm `S3_PUBLIC_BASE_URL` includes bucket path on Vercel
- [ ] Set `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` and webhook URL for live card checkout
- [ ] Optional: custom media hostname `media.denard.co.uk`
- [ ] Smoke test: bag → Pay by card → success page → Admin enquiry paid
- [ ] Smoke test: WhatsApp enquiry path still works

## 5. Roadmap

| Phase | Scope |
|-------|--------|
| 1 | WhatsApp catalogue + enquiry |
| 2 | Merchandising, analytics, CRM exports |
| 3 | On-site Stripe Checkout from bag (**shipped**) |
| 4 | Optional: PDP buy-now, email receipts, richer fulfilment |
