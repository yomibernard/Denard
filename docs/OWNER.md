# Denard owner runbook

Short operating guide for the business owner. Technical setup lives in `docs/PRODUCTION.md`.

## Day 0 — first login

1. Open `https://denard.co.uk/admin/login`
2. Sign in with the credentials your developer gave you (not the public sample password).
3. Go to **Users → Change my password** and set a unique password (10+ characters, letters and numbers).
4. Go to **Settings** and confirm:
   - WhatsApp number (digits with country code, e.g. `447887539426`)
   - Business email (`hello@denard.co.uk`), phone, service hours, address
5. Hit `https://denard.co.uk/api/health` — should show database up (ask your developer if unsure).
6. On your phone, open a product on https://denard.co.uk → **Enquire on WhatsApp**.
7. Confirm WhatsApp opens with a filled message and an **Enquiry Reference** like `DEN-2026-000001`.
8. In **Admin → Enquiries**, open that reference, reply via **WhatsApp customer**, then update the status.

## Daily ops

1. Open **Admin → Dashboard** (or Enquiries filtered to **NEW** / **WHATSAPP OPENED**).
2. For each new enquiry:
   - Open the detail page
   - Message the customer on WhatsApp
   - Update **enquiry status** (e.g. Customer contacted → Availability confirmed → Awaiting payment)
   - If they paid offline, fill **payment status / method / reference / amount / date** (separate from WhatsApp status)
   - Add internal notes for your team
3. Mark sold-out products **OUT OF STOCK** or **Archive** them under Products.
4. Spot-check the shop on your phone after publishing anything new.

## Weekly ops

1. Add or refresh products with **real photos** (Product images → upload). Avoid SVG placeholders for live jewellery.
2. On each product, tick the right **Categories** and **Collections** so it appears in the right shop sections.
3. Add colour/size/style variants in the Variants box when needed (`SKU | Style | Colour | Size | Price`).
4. Review **Content** (About / FAQ / Privacy / Terms) and **Homepage** toggles if anything needs updating.
5. Check **Reports** and export newsletter CSV if marketing needs the list.
6. Export enquiries: Admin → Enquiries → **Export CSV**.
7. Confirm backups ran (ask your host/developer if unsure — database + media).
8. Review Privacy / Terms still match how you trade (update with your solicitor when needed).

## Taking card payment (optional)

When Stripe is connected by your developer:

1. Open the enquiry in Admin.
2. Confirm availability and any delivery add-on amount.
3. Click **Create payment link**.
4. Tap **Send payment link on WhatsApp**.
5. When the customer pays, status moves to **Payment confirmed** automatically (webhook).

You can still record bank transfer / cash payments manually in the Payment fields.

- [ ] Name, SKU, price, short description
- [ ] Status = **PUBLISHED**
- [ ] At least one real product photo (primary image)
- [ ] Department + categories / collections selected
- [ ] Variants selected if the piece has colour/size options
- [ ] Appears correctly on shop + WhatsApp enquiry test
- [ ] Moderate new **Reviews** under Admin → Reviews when customers submit them

## Who can do what

| Role | Typical use |
|------|-------------|
| Business owner / Super admin | Everything, including users & settings |
| Product / catalogue | Products, images, categories |
| Sales / customer service | Enquiries only |

Create staff under **Admin → Users**. Never share the owner password.

## When to call your developer

- Site down or admin login broken
- WhatsApp links open blank or to the wrong number
- Image uploads fail after go-live (usually S3/R2 credentials)
- Need a new production domain or SSL
- Want online card checkout (Phase 3 — not on by default)
