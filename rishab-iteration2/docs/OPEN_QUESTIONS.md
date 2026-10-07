# Open Questions / Implementation Decisions — Iteration 1

The requirements (`docs/requirements.md`) leave the items below undecided. For each one, Iteration 1 does the **minimum**, and the item is listed here so the client can confirm it. Nothing below is a new business requirement.

## Questions for the client

| # | Area | Question | Current prototype behaviour |
|---|------|----------|-----------------------------|
| 1 | Marketplace | ~~What is a "product"?~~ Answered (requirements §11): building materials. Open: is this GittiMitti's own store or a marketplace with other suppliers too? | Product has unit, brand, grade/size, minimum order, optional price. Demo data has GittiMitti plus one sample supplier. |
| 2 | Suppliers | ~~Do suppliers log in?~~ Answered (requirements §10): suppliers register and log in. Roles: `user`, `supplier`, `admin`. | Supplier registers with a business name, which creates their supplier profile. Admin can still create suppliers that have no login. |
| 3 | Purchasing | ~~Is there a cart?~~ Answered (requirements §12): quotation first, no cart. Open: should one quote request cover several items (a list/basket) instead of one item per request? | One item per quote request; each accepted quote becomes its own order. A customer can still buy from many suppliers through separate quotes. |
| 4 | Orders | Which order statuses and transitions exist (e.g. confirmed, cancelled, completed)? Can admin change the status? | Only `pending` → `paid`, and only through payment. Admin can view orders but not change them. |
| 5 | Payments | Which gateway (Razorpay / Cashfree / PayU)? Is full payment taken upfront, or is it a booking amount? What about refunds? | Mock gateway, full order amount, no refunds. If a payment fails, the order stays `pending` and the user can retry. |
| 6 | Payments | What should admin "payment management" include beyond viewing payments? | Read-only list of payments. |
| 7 | Notifications | Which events trigger notifications, on which channels? Which providers? | Mock providers. "Order placed" and "Payment succeeded" go out on email, SMS and WhatsApp. SMS/WhatsApp are skipped when the user has no phone number. |
| 8 | Users | Is a mobile number mandatory at registration? Is OTP verification needed? | Optional. No OTP. |
| 9 | Users | What should admin "user management" include? | View users, activate/deactivate. |
| 10 | Catalog | Is stock/inventory or availability needed? | Not tracked. |
| 11 | Pricing | Are taxes (GST), fees or commissions applied? | None. Order total = sum of item prices. |
| 12 | AI | What may the WhatsApp AI assistant answer or do? Must users be identified, and how? Which AI provider? | Not built yet. TECH_STACK says AI comes after the core application works. |
| 14 | Suppliers | Does a newly registered supplier need admin approval before going live? | No. The supplier is active right after registering. Admin can deactivate them from Users or Suppliers. |
| 15 | Suppliers | §10 says a supplier can *see* their items. May suppliers also add and edit them, or only the admin? | Supplier can add, edit, deactivate and delete their own items. Items that are already in an order can't be deleted. Admin can still manage every item. |
| 16 | Suppliers | What order details may a supplier see (customer phone, email)? Can a supplier change an order's status? | Supplier sees order number, date, customer name, delivery address, status, and only their own items and subtotal. Read-only. |
| 17 | Suppliers | Should a supplier be told (WhatsApp, SMS or email) when they receive an order? | No supplier notifications. |
| 18 | Suppliers | Can a supplier account also buy items? | No. Suppliers don't see the Request quote button. |
| 19 | Mobile | Should the Android app support supplier login too? | Android app is customer-only: search by product/supplier, request quote, accept quote, pay. Supplier screens are web-only. |
| 13 | Delivery | Which districts/pin codes are served? Delivery charges (website says free above ₹50,000, remote areas extra)? Who delivers? | Delivery address + district captured. District list: Samastipur, Darbhanga, Begusarai, Muzaffarpur, Other. No charges, no serviceability check. |
| 20 | Quotes | Can a quote expire, be rejected by the customer, or be declined by the supplier (e.g. out of stock)? Can the price change after acceptance? | requested → quoted → accepted. Supplier/admin can revise the price until the customer accepts. No expiry, reject or decline. The listed price is only indicative. |
| 21 | Quotes | Should the customer be told on WhatsApp/SMS when a price is sent, and the supplier when a quote is requested? | Customer gets a mock "quote received" notification. Supplier gets none. |
| 22 | Enquiries | Who handles enquiries (admin only, or routed to suppliers)? Which statuses? Notify admin on WhatsApp? Spam protection? | Admin-only list with new / contacted / closed. No notification, no captcha or rate limit yet. |
| 23 | Pricing | GST: are listed/quoted prices inclusive? Is a GST invoice needed per order? | No GST handling. |
| 24 | Language | Is Hindi needed in the app (the website has an EN/हिंदी toggle)? | English only. |

## Technical decisions (not business scope)

- Products, suppliers and categories have an `is_active` flag. Deleting a record that is still in use returns 409, so the admin deactivates it instead. This keeps order history intact.
- Each order item stores the product name, supplier name and unit price at the time of the order, so later price changes do not alter past orders.
- Prices are always computed on the server. Payment status comes from the gateway adapter on the server, never from the client.
- Payment gateway, notification and (future) AI providers sit behind adapters in `backend/app/integrations/`, so real providers can be swapped in without touching business logic.
- If a notification fails, the order or payment is still saved. The failure is recorded in the `notifications` table.
- The admin "Notifications" tab exists only to show the mock notification log during demos.
