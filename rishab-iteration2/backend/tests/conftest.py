import os

os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production-use-only-1234")
os.environ.setdefault("DATABASE_URL", os.environ.get("TEST_DATABASE_URL", "sqlite://"))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.db import Base, get_db  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User, UserRole  # noqa: E402

DELIVERY = {
    "delivery_address": "Near Railway Station, Main Road",
    "delivery_city": "Samastipur",
    "delivery_district": "Samastipur",
}

url = get_settings().sqlalchemy_url
kwargs = (
    {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool}
    if url.startswith("sqlite")
    else {}
)
engine = create_engine(url, **kwargs)
TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    session = TestSession()
    yield session
    session.close()


@pytest.fixture()
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _make_user(db, email, role=UserRole.USER, phone="+919876543210"):
    user = User(
        full_name=email.split("@")[0],
        email=email,
        phone=phone,
        password_hash=hash_password("password123"),
        role=role,
    )
    db.add(user)
    db.commit()
    return user


def _auth(client, email):
    r = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def user_headers(client, db):
    _make_user(db, "user@example.com")
    return _auth(client, "user@example.com")


@pytest.fixture()
def other_user_headers(client, db):
    _make_user(db, "other@example.com")
    return _auth(client, "other@example.com")


@pytest.fixture()
def admin_headers(client, db):
    _make_user(db, "admin@example.com", role=UserRole.ADMIN)
    return _auth(client, "admin@example.com")


@pytest.fixture()
def catalog(client, admin_headers):
    """Two suppliers, one category, one product per supplier."""
    h = admin_headers
    cat = client.post("/api/admin/categories", json={"name": "Plots"}, headers=h).json()
    s1 = client.post("/api/admin/suppliers", json={"name": "Supplier A"}, headers=h).json()
    s2 = client.post("/api/admin/suppliers", json={"name": "Supplier B"}, headers=h).json()
    p1 = client.post(
        "/api/admin/products",
        json={"name": "P1", "price": "1000.50", "supplier_id": s1["id"], "category_id": cat["id"]},
        headers=h,
    ).json()
    p2 = client.post(
        "/api/admin/products",
        json={"name": "P2", "price": "250.00", "supplier_id": s2["id"], "category_id": cat["id"]},
        headers=h,
    ).json()
    return {"category": cat, "suppliers": [s1, s2], "products": [p1, p2]}


def order_via_quote(client, user_headers, admin_headers, product_id, quantity=1, unit_price="100"):
    """Customer requests a quote, admin prices it, customer accepts; returns the order."""
    q = client.post(
        "/api/quotes",
        json={**DELIVERY, "product_id": product_id, "quantity": quantity},
        headers=user_headers,
    )
    assert q.status_code == 201, q.text
    qid = q.json()["id"]
    r = client.post(
        f"/api/admin/quotes/{qid}/respond", json={"unit_price": unit_price}, headers=admin_headers
    )
    assert r.status_code == 200, r.text
    a = client.post(f"/api/quotes/{qid}/accept", headers=user_headers)
    assert a.status_code == 200, a.text
    return client.get(f"/api/orders/{a.json()['order_id']}", headers=user_headers).json()
