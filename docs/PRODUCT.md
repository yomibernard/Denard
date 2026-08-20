# Denard product documentation

## 1. Assumptions & clarifications

| ID | Assumption | Impact |
|----|------------|--------|
| A1 | Phase 1 has no online payments | WhatsApp enquiry is the conversion path |
| A2 | SQLite for local/dev; PostgreSQL for production | Change `provider` + `DATABASE_URL` + adapter |
| A3 | WhatsApp phone configured via env + admin settings | Never hard-coded in UI components |
| A4 | Catalogue navigation is DB-driven | Departments/categories not duplicated in nav constants |
| A5 | Placeholder SVG imagery for demo | Replace with CDN/product photography |
| A6 | Testimonials are service stories, not fabricated product reviews | Reviews feature reserved for later |
| A7 | Multi-currency / i18n deferred | Schema has `currency` field for extension |

## 2. Architecture

```
Browser → Next.js App Router
  ├─ (shop) storefront SSR/CSR
  ├─ admin portal (JWT cookie session)
  └─ API routes (/api/enquiries, /api/search, /api/admin/*)
         ↓
     Prisma ORM → SQLite / PostgreSQL
```

Extension path for payments: introduce `Order` model linked from `Enquiry`, add payment provider module, reuse basket → cart mapping without rebuilding catalogue UI.

## 3. Data model (summary)

Department → Category (tree) → Product → Variant (colour/size)  
Collection, Brand, Material, Tag as facets  
Enquiry + EnquiryItem with frozen price snapshot  
User + AuditLog + AnalyticsEvent + SiteSetting + HomepageSection + Banner

## 4. Security plan

- Admin passwords bcrypt (cost 12)
- HTTP-only JWT cookies, 7-day expiry
- Role-based nav + API checks via `ROLE_PERMISSIONS`
- No payment card collection in phase 1
- Env secrets never committed (`.env` gitignored)
- Audit log for admin mutations (extend as needed)

## 5. SEO plan

- Metadata API on layouts/pages
- `robots.ts`, `sitemap.ts`
- Clean URLs: `/department/[slug]`, `/category/[slug]`, `/collection/[slug]`, `/product/[slug]`
- Product/organisation schema ready to extend on PDP
- Editable SEO fields on products/categories in admin

## 6. Analytics plan

Client `trackEvent()` → `POST /api/analytics` plus optional GA/Meta hooks.  
Events: product_view, search, add_to_enquiry, whatsapp_redirect, filter_use, etc.

## 7. Test strategy

- Smoke: homepage → shop → PDP → enquiry → WhatsApp URL
- Admin: login, create product, update enquiry status
- Mobile: filter drawer, sticky PDP actions, FAB not covering CTAs
- A11y: skip link, focus rings, contrast on accent green
- Perf: image SVGs/local, dynamic pages, Core Web Vitals after photo CDN

## 8. Launch checklist

- [ ] Set production `AUTH_SECRET`, WhatsApp number, `NEXT_PUBLIC_SITE_URL`
- [ ] Migrate to managed PostgreSQL + backups
- [ ] Replace placeholder imagery
- [ ] Configure CDN / image host
- [ ] Enable HTTPS and security headers
- [ ] Seed real catalogue via CSV import (phase 1.1)
- [ ] Staff training on enquiry statuses
- [ ] Verify WhatsApp Business number and greeting message
- [ ] Privacy/cookie notice for target markets
- [ ] Smoke test on low-end Android + iPhone + desktop

## 9. Future roadmap

| Phase | Scope |
|-------|--------|
| 1.1 | CSV import/export polish, richer admin merchandising |
| 2 | Customer accounts, saved addresses |
| 3 | Online payments + full checkout (cart maps from enquiry basket) |
| 4 | Delivery integrations + tracking |
| 5 | Reviews, loyalty, multi-currency/language |
| 6 | WhatsApp Business API automation |
| 7 | Native mobile app / marketplace sellers |

## 10. Competitor benchmarks (principles only)

Zara (merchandising clarity), ASOS (filters), Apple (hierarchy), Amazon (search/info), IKEA (taxonomy), Sephora (variants), Shopify (ops), WhatsApp Business (conversational commerce).
