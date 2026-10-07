# GittiMitti Building-Materials Marketplace — Iteration 1 (Prototype)

A multi-supplier marketplace prototype. Docs:
- Requirements (source of truth): [`docs/requirements.md`](docs/requirements.md)
- Tech stack: [`docs/TECH_STACK.md`](docs/TECH_STACK.md)
- Open questions and implementation decisions: [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md)
- AI assistant rules: [`AGENTS.md`](AGENTS.md)

```
backend/   FastAPI + SQLAlchemy + Alembic + PostgreSQL (one API for web and Android)
web/       React + TypeScript + Vite + MUI (customer site + admin dashboard)
mobile/    Expo / React Native + TypeScript (Android customer app)
```

## What's implemented

| Requirement | Status |
|---|---|
| Marketplace: buy products from multiple suppliers | Cart → one order can hold items from several suppliers; each item keeps its supplier |
| User registration / login / dashboard | JWT auth; dashboard shows profile and orders (web + mobile) |
| Supplier registration + role-based dashboards | Register as Customer or Supplier (web). After login each role lands on its own dashboard: customer → `/dashboard`, supplier → `/supplier` (My items, Orders), admin → `/admin`. Customers can browse all suppliers and their items on `/suppliers` |
| Admin dashboard | Overview + Users, Suppliers, Categories, Products, Orders, Payments |
| Payment gateway + payment management | **Mock** gateway behind an adapter (`backend/app/integrations/payment_gateway.py`); admin payment list |
| Order management | User orders + admin order list/detail (read-only, see open questions) |
| Notifications (WhatsApp / Email / SMS) | **Mock** senders behind an adapter (`backend/app/integrations/notifications.py`), logged to DB |
| WhatsApp AI assistant | Not started. Per TECH_STACK, added after the core application works |

## Local development

Prerequisites: Python 3.10+, Node 20+, Docker (for PostgreSQL).

```bash
# Database
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=marketplace -p 5432:5432 postgres:16-alpine

# Backend
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # then set JWT_SECRET to a random value
alembic upgrade head
python -m app.scripts.create_admin --email admin@example.com   # prompts for password
DEMO_SUPPLIER_PASSWORD=... python -m app.scripts.seed_demo     # optional sample catalog (+ supplier logins)
uvicorn app.main:app --reload --port 8000                      # API docs: http://localhost:8000/docs

# Web (proxies /api to :8000)
cd web && npm install && npm run dev                           # http://localhost:5173

# Mobile (Android emulator reaches the backend at 10.0.2.2:8000)
cd mobile && npm install && npx expo start --android
```

## Tests and checks

```bash
cd backend && pytest && ruff check . && ruff format --check .
# Against PostgreSQL instead of SQLite:
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/marketplace_test pytest
cd web && npm test && npm run lint && npm run build
cd mobile && npm run typecheck
```

## Deploying to Railway

1. Create a Railway project and add the **PostgreSQL** plugin.
2. **Backend service**: root directory `backend`.
   - Build command: `pip install -r requirements.txt`
   - Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Variables:
     - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
     - `JWT_SECRET` (random, at least 32 characters)
     - `CORS_ORIGINS` (the web service URL)
3. **Web service**: root directory `web`.
   - Build command: `npm ci && npm run build`
   - Serve `dist/` as a static site.
   - Set `VITE_API_URL=https://<backend>.up.railway.app/api` at build time.
4. Run `python -m app.scripts.create_admin --email ...` once using `railway run`.
5. **Mobile**: set `EXPO_PUBLIC_API_URL` to the backend URL and build with EAS (`npx eas-cli build -p android`).

## API overview

All routes live under `/api`. The interactive docs are at `/docs`.

- **Auth**: `POST /auth/register` (`role`: `user` or `supplier`; suppliers also send `supplier_name`), `POST /auth/login`, `GET /auth/me`
- **Catalog (public)**: `GET /products?q=&category_id=&supplier_id=`, `GET /products/{id}`, `GET /categories`, `GET /suppliers`
- **Supplier** (`/supplier/...`, supplier only): `GET profile`; own items `GET/POST products`, `PATCH/DELETE products/{id}`; `GET orders` (orders containing their items, only their lines)
- **Orders (user)**: `POST /orders`, `GET /orders`, `GET /orders/{id}`
- **Payments (user)**: `POST /orders/{id}/payments`, `GET /orders/{id}/payments`, `POST /payments/{id}/confirm`
- **Admin** (`/admin/...`, admin only):
  - `GET stats`
  - Users: list; activate/deactivate with `PATCH`
  - Suppliers, categories, products: full CRUD
  - Orders, payments, notifications: read-only
