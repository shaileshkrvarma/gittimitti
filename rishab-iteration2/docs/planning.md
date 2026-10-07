# Planning — Marketplace for GittiMitti Infratech

Status: **Draft for client discussion.** Nothing in this document is an approved requirement. Each proposal below needs client approval and must be added to `requirements.md` before it is built (see `AGENTS.md` §2, §20).

Source reviewed: https://gittimitti.com/ (single-page site, reviewed 2026-10-07).

---

## 1. What the business does today (from the website)

| Area | What the site shows |
|---|---|
| Business | GittiMitti Infratech, proprietor Atul Prakash. Building materials supplier and construction contractor in Samastipur, Bihar. Claims "since 2010", 50+ projects, 500+ clients. |
| Service area | Samastipur, Darbhanga, Begusarai, Muzaffarpur and nearby districts. Delivers to remote villages. |
| Material categories (8) | Red clay bricks · Cement (OPC/PPC: UltraTech, ACC, JK) · TMT steel bars (Fe-500D/550D) · Sand & aggregate (river sand, M-sand, 10/20 mm) · Floor & wall tiles · Roofing sheets (GI, colour-coated, PVC) · Paints & primers (Asian, Berger, Dulux) · Plumbing & electrical |
| Pricing | No prices on the site. Every product has a **"Get Quote"** button that opens WhatsApp. |
| Construction services (6) | Residential · Commercial · Interior finishing · Renovation & repair · Architectural design (free with every project) · Government contracts (PMAY, schools, panchayat) |
| Projects | 3 ongoing projects (3BHK villa, 2BHK villa, 5BHK duplex) with area and status |
| Trust content | ISI/BIS-certified materials, free delivery within 48 hours, EMI/credit options, 5-year construction warranty, customer reviews, FAQ |
| Business terms stated in the FAQ | Free site visit and estimate within 48 h · ₹1,400–2,400/sqft construction cost · free delivery above ₹50,000, transport charge for remote areas · construction contracts paid by milestone (20% advance + 4–5 instalments) · GST registered, GST invoices · 1,000 sqft house in 6–8 months |
| Lead capture | Enquiry form: name, mobile (required), city/village, "I need help with" (7 categories), message. Plus Call, WhatsApp (+91 96543 99439) and email (ceo@gittimitti.com). Promises a reply within 30 minutes. |
| Language | Full English / Hindi toggle |
| Technology | Static single page with one `main.js`, a PWA manifest and a WhatsApp floating button. No login, cart, online ordering or payment. |

### Content issues to point out to the client
- The hero says "Muzaffarpur & across Bihar", but the office and everything else say Samastipur.
- The tiles card says "100+ designs" in one place and "200+ designs" in another.
- "FAQ" appears twice in the footer quick links.
- The footer still says © 2025.
- Claims like "Samastipur's #1 Builder" and "8% below market" (in a review) may need evidence.

---

## 2. How the current prototype maps to this business

| Prototype today | Fit for GittiMitti | Gap |
|---|---|---|
| Multi-supplier marketplace: suppliers register, list items, see their orders | Partial. Today GittiMitti is a **single seller**. | Who the other suppliers would be (brick kilns, cement dealers, contractors?) is undecided. See Q1. |
| Generic product: name, price, image, category, supplier | Partial | Building materials need a **unit** (bag, tonne, piece, cft, trolley, sq ft), brand, grade/size and maybe a minimum order. Many items are **quote-only**, with no fixed price. |
| Fixed price, cart, checkout, mock payment | Partial | The website works on "Get Quote". Prices for sand, steel and cement change often. |
| Order quantity capped at 1,000 per line | Doesn't fit | Bricks are ordered in thousands. The cap is a technical default, not a business rule. |
| No delivery address | Doesn't fit | Delivery to site/village is central: address, district, maybe a site location. |
| Order statuses: pending → paid | Too simple | Material orders probably need confirmed / dispatched / delivered / cancelled. Needs client definition. |
| No GST | Doesn't fit | The business issues GST invoices. GST rate per item and invoice format are needed. |
| Mock WhatsApp / SMS / email | Good foundation | The business is WhatsApp-first. A real WhatsApp Business API provider is the priority. |
| No construction services | Gap | Services are leads (enquiry → site visit → estimate → contract), not cart items. |
| English only | Gap | The current site is bilingual; rural customers expect Hindi. |
| Email + password login, mobile optional | Weak fit | The enquiry form makes mobile mandatory. OTP-on-mobile login probably suits customers better. |
| WhatsApp AI assistant (not built) | Strong fit | Most traffic already goes to WhatsApp. The FAQ, catalogue and enquiry form are natural AI-assistant content. |

---

## 3. Proposed phases (each needs client approval first)

Sizes: **S** ≈ 1–2 days, **M** ≈ 3–5 days, **L** ≈ 1–2 weeks of development, excluding waiting time for client answers, provider KYC and app-store review.

### Phase 0 — Decisions (client meeting)
Go through the questions in §4 and update `requirements.md`. Nothing below starts until its questions are answered.

### Phase 1 — Catalogue that fits building materials (M)
- Seed the 8 categories from the website.
- Product fields: unit, brand, grade/size, minimum order quantity, "price on request" flag, image.
- Replace the fixed 1,000 per-line cap with the per-product minimum/maximum the client defines.
- Customer can browse by category, brand and supplier (supplier view already exists).

### Phase 2 — Enquiries and quotes (M)
- Product "Get Quote": the customer sends quantity and delivery location; supplier/admin reply with a price; the customer accepts and it becomes an order.
- Service enquiry form, the same fields as the current website form: name, mobile, city/village, service type, message.
- Admin and supplier "Leads" tab with status (new / contacted / site visit / quoted / won / lost). The list of statuses is for the client to confirm.
- Every enquiry is notified to the business on WhatsApp (mock until Phase 4).

### Phase 3 — Real ordering (L)
- Delivery address, district and serviceable-area check.
- Delivery-charge rule. The site says free above ₹50,000 and a charge for remote areas; the exact rule must be confirmed.
- Order statuses and who may change them (supplier/admin).
- GST on items and a downloadable GST invoice.
- Payment method(s) decided by the client: online gateway (Razorpay / Cashfree / PayU), cash on delivery, part advance.
- Cancellation/refund rule, if any.

### Phase 4 — Real notifications (M)
- WhatsApp Business API provider (e.g. Meta Cloud API, Gupshup, Interakt, AiSensy), SMS provider (DLT registration is mandatory in India) and email provider. These plug into the existing adapter in `backend/app/integrations/notifications.py`.
- Events: enquiry received, quote sent, order placed/confirmed/dispatched/delivered, payment received. The client picks the list.

### Phase 5 — WhatsApp AI assistant (L)
- Answers the FAQ, product and category questions and order status (after verifying the mobile number), and captures enquiries.
- Hindi and English.
- Uses only live data from the app; it doesn't invent prices or availability (`AGENTS.md` §13). Hands off to a human when unsure.
- Needs the Phase 4 WhatsApp provider plus an AI API choice.

### Phase 6 — Bilingual UI, login, launch (M)
- English/Hindi toggle on web and Android.
- OTP login on mobile number, if approved.
- Deploy to Railway. Domain plan, e.g. keep gittimitti.com as the marketing site and run the store on `shop.gittimitti.com`, or replace the site. This is the client's choice.
- Android build on the Play Store (Expo EAS).

### Later / optional (only if the client asks)
- Construction project tracking for customers (milestones, photos, milestone payments as in the FAQ).
- Projects gallery and reviews moved into the app.
- EMI / credit, warranty records.

---

## 4. Questions for the client

**Business model**
1. Is the platform **only GittiMitti's store**, or a marketplace where **other suppliers** (kilns, dealers, contractors) also sell? If others: does GittiMitti take a commission, and who delivers?
2. Should construction services be in the app as enquiries/leads, or materials only for now?

**Catalogue and pricing**

3. Which items have a fixed online price and which stay "Get Quote"? How often do prices change, and who updates them?
4. Units and minimum order per item (e.g. bricks per 1,000, cement per bag, sand per trolley/cft)?
5. Is stock/availability needed?

**Orders, delivery, payment**

6. Delivery areas (district list or pin codes), and the exact delivery-charge rule.
7. Order statuses and who changes them.
8. Payment options: online gateway, cash on delivery, advance + balance? Which gateway?
9. GST rate per category and invoice format. Should the GSTIN appear on invoices?
10. Cancellation/refund policy.

**Customers and language**

11. Mobile number mandatory? OTP login instead of a password?
12. Is Hindi required at launch?

**Notifications and AI**

13. Which WhatsApp, SMS and email providers, and is there an existing WhatsApp Business account?
14. Which events must notify the customer, and which notify the business?
15. What may the WhatsApp AI assistant answer or do? Can it quote prices, or only take enquiries?

**Website**

16. Keep the current gittimitti.com and link to the store, or replace it with the new app?
17. Who maintains products, projects and reviews content?

---

## 5. Already done in the prototype (Iteration 1)
- Customer / supplier / admin registration and login with a dashboard for each role.
- Suppliers list their own items and see the orders that contain them.
- Customers browse all suppliers and items, use a cart and check out across suppliers.
- Mock payment (success/failure) and mock WhatsApp/SMS/email logs.
- Admin: users, suppliers, categories, products, orders, payments, notifications.
- Web (React) and Android (Expo) apps on one FastAPI + PostgreSQL backend.

See `README.md` and `docs/OPEN_QUESTIONS.md` for details.
