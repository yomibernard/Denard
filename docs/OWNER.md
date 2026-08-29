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
6. On your phone, open a product on https://denard.co.uk → add to bag → **Your bag**.
7. Confirm you can either **Pay by card** (if Stripe is live) or **Send on WhatsApp**, and that you get an **Enquiry Reference** like `DEN-2026-000001`.
8. In **Admin → Enquiries**, open that reference, reply via **WhatsApp customer** if needed, then update the status.

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

## Taking card payment

### Customer pays on the website (Phase 3)

When your developer has set Stripe keys on Vercel:

1. Customer adds pieces to **Your bag**, enters name + phone, taps **Pay by card**.
2. They complete Stripe Checkout (GBP) and land on the payment success page.
3. Admin → Enquiries shows the reference as **Payment confirmed** (webhook or success-page reconcile).
4. Message them on WhatsApp to arrange delivery / collection.

To temporarily hide **Pay by card** without removing Stripe admin links, set `DISABLE_SHOP_CHECKOUT=true` on Vercel.

### Staff sends a payment link (WhatsApp)

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
- Card checkout missing on Your bag (usually Stripe keys / webhook not set)
- Payments succeed in Stripe but enquiries stay unpaid (webhook secret / URL)

## Training click-paths (no developer needed)

### Publish a new jewellery product
1. Admin → **Products → New product**
2. Fill name, SKU, price, short description → **Create as draft**
3. Upload at least one photo (drag & drop)
4. Tick **Jewellery** (and Women if relevant) under Categories
5. When name + SKU + price + photo are ready, the product **goes live automatically**
6. Open **View on shop** from the review panel and confirm the photo loads

### Fix a product that is live but missing from Jewellery
1. Admin → Products → open the product
2. Under Categories, tick **Jewellery** → Save
3. Hard-refresh `/category/jewellery` on your phone

### Handle a privacy (GDPR) request
1. Admin → **Privacy**
2. Open the request, set status to **IN PROGRESS**, then **DONE** when fulfilled
3. Keep notes in the request details / your solicitor file

### Moderate a customer review
1. Admin → **Reviews**
2. Approve or reject new submissions
3. Approved reviews appear on the product page

### Export enquiries for your records
1. Admin → **Enquiries → Export CSV**
2. Store the file securely (contains customer phone numbers)

### Style Concierge (automated taste proposals)
1. On the shop, use the sparkle button (above WhatsApp) or open **/style**
2. Customers set metals / vibe / occasions / budget on their device
3. Homepage and product pages show a **For you** rail from browse + wishlist + prefs
4. **Continue on WhatsApp** sends their taste summary + proposed SKUs to you
5. Optional: ask your developer to set `OPENAI_API_KEY` for richer written advice (matching still works without it)

