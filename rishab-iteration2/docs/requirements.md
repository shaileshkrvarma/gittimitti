Real Estate E-commerce Marketplace
Initial Requirements — Iteration 1
Status: Draft
Purpose: Initial requirements gathered from the client.
Scope: This document captures only the requirements identified so far. It is expected to evolve during subsequent iterations.

1. Marketplace
- The system should allow users to purchase products from multiple suppliers.
- The system should allow supplier names and product details to be added.
2. User Management
- User registration.
- User login.
- User dashboard.
3. Admin Management
- Admin dashboard.
- User management.
- Supplier management.
- Product management.
- Category management.
- Payment management.
- Order management.
4. Payment
- Payment gateway integration.
- Payment management.
5. Order Management
- Order management.
6. Supplier Management
- Supplier management.
7. Category Management
- Category management.
8. Notifications
The system should be able to notify users through:
- WhatsApp.
- Email.
- SMS.
9. AI Assistant
- The system should provide an AI assistant chatbot through WhatsApp.
10. Roles and Dashboards (client update, Iteration 1)
- A supplier must register first.
- A user can register first.
- When they log in, they should see the dashboard based on their role.
- A supplier can see all their supplier items.
- A user can see all the suppliers and their items and can add them to the cart.
- The user can then check out, and the supplier can see the order.
11. Building-materials marketplace (client update, Iteration 1, based on docs/planning.md and gittimitti.com)
- Products are building materials (bricks, cement, TMT steel, sand & aggregate, tiles, roofing sheets, paints, plumbing & electrical).
- A product has a unit (bag, tonne, piece, trolley…), brand, grade/size and minimum order quantity.
- A product may have no fixed price ("Price on request"); the customer then asks for a quote.
- Get Quote: the customer requests a quote for a quantity and delivery place; the supplier (or admin) replies with a price; the customer accepts and it becomes an order.
- Checkout and quotes capture a delivery address, city/village and district.
- Public enquiry form (name, mobile, city/village, need category, message) for construction services and materials; admin can view enquiries and mark them new / contacted / closed.
12. Iteration 2 (client update)
- One single page for suppliers and products (replaces the separate Products and Suppliers pages).
- The user can search either by supplier or by product.
- The user asks for a quotation first; the supplier sees the quotation request and responds. Orders are created only from an accepted quotation (the cart is removed).
Requirement Status
This is the first iteration of development and should be treated as a draft version.
The requirements may be refined, corrected, expanded, or changed based on further discussion with the client.
Scope Control
No additional business requirements should be assumed at this stage. Any new functionality identified during development should first be discussed and approved before being added to the requirements.
Duplicate Requirements
The original client notes contained repeated entries for:
- Supplier Management.
- Category Management.
These have been consolidated in this document.
