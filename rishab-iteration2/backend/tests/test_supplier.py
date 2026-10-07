from decimal import Decimal

from tests.conftest import _auth, order_via_quote


def _register_supplier(client, email="sup@example.com", name="Sup Realty"):
    return client.post(
        "/api/auth/register",
        json={
            "full_name": "Sup Owner",
            "email": email,
            "password": "password123",
            "role": "supplier",
            "supplier_name": name,
        },
    )


def _supplier_headers(client, email="sup@example.com", name="Sup Realty"):
    r = _register_supplier(client, email, name)
    assert r.status_code == 201, r.text
    return _auth(client, email)


def test_register_defaults_to_user(client):
    r = client.post(
        "/api/auth/register",
        json={"full_name": "U", "email": "u@example.com", "password": "password123"},
    )
    assert r.status_code == 201
    assert r.json()["role"] == "user"


def test_register_supplier_creates_profile(client):
    r = _register_supplier(client)
    assert r.status_code == 201, r.text
    assert r.json()["role"] == "supplier"
    h = _auth(client, "sup@example.com")
    profile = client.get("/api/supplier/profile", headers=h).json()
    assert profile["name"] == "Sup Realty"
    assert profile["email"] == "sup@example.com"
    assert [s["name"] for s in client.get("/api/suppliers").json()] == ["Sup Realty"]


def test_register_supplier_validation(client):
    r = client.post(
        "/api/auth/register",
        json={
            "full_name": "S",
            "email": "s@example.com",
            "password": "password123",
            "role": "supplier",
        },
    )
    assert r.status_code == 422
    r = client.post(
        "/api/auth/register",
        json={
            "full_name": "A",
            "email": "a@example.com",
            "password": "password123",
            "role": "admin",
        },
    )
    assert r.status_code == 422


def test_register_duplicate_supplier_name(client):
    assert _register_supplier(client).status_code == 201
    r = _register_supplier(client, email="sup2@example.com", name="sup realty")
    assert r.status_code == 409
    # the user account must not be created either
    login = client.post(
        "/api/auth/login", json={"email": "sup2@example.com", "password": "password123"}
    )
    assert login.status_code == 401


def test_supplier_endpoints_require_supplier(client, user_headers, admin_headers):
    assert client.get("/api/supplier/products").status_code == 401
    assert client.get("/api/supplier/products", headers=user_headers).status_code == 403
    assert client.get("/api/supplier/orders", headers=admin_headers).status_code == 403


def test_supplier_manages_own_products(client, catalog):
    h = _supplier_headers(client)
    cat_id = catalog["category"]["id"]
    r = client.post(
        "/api/supplier/products",
        json={"name": "Villa", "price": "5000000", "category_id": cat_id, "supplier_id": 999},
        headers=h,
    )
    assert r.status_code == 201, r.text
    product = r.json()
    assert product["supplier"]["name"] == "Sup Realty"

    mine = client.get("/api/supplier/products", headers=h).json()
    assert [p["name"] for p in mine] == ["Villa"]
    public = {p["name"] for p in client.get("/api/products").json()}
    assert "Villa" in public

    r = client.patch(f"/api/supplier/products/{product['id']}", json={"price": "10"}, headers=h)
    assert r.status_code == 200 and Decimal(r.json()["price"]) == Decimal("10")

    other_id = catalog["products"][0]["id"]
    assert (
        client.patch(
            f"/api/supplier/products/{other_id}", json={"price": "1"}, headers=h
        ).status_code
        == 404
    )
    assert client.delete(f"/api/supplier/products/{other_id}", headers=h).status_code == 404
    assert client.delete(f"/api/supplier/products/{product['id']}", headers=h).status_code == 204


def test_supplier_product_validation(client, catalog):
    h = _supplier_headers(client)
    r = client.post(
        "/api/supplier/products",
        json={"name": "X", "price": "10", "category_id": 999},
        headers=h,
    )
    assert r.status_code == 422
    r = client.post(
        "/api/supplier/products",
        json={"name": "X", "price": "0", "category_id": catalog["category"]["id"]},
        headers=h,
    )
    assert r.status_code == 422


def test_supplier_sees_only_own_order_items(client, user_headers, admin_headers, catalog):
    ha = _supplier_headers(client, "a@example.com", "Sup A")
    hb = _supplier_headers(client, "b@example.com", "Sup B")
    cat_id = catalog["category"]["id"]
    pa = client.post(
        "/api/supplier/products",
        json={"name": "A1", "price": "100", "category_id": cat_id},
        headers=ha,
    ).json()
    pb = client.post(
        "/api/supplier/products",
        json={"name": "B1", "price": "40", "category_id": cat_id},
        headers=hb,
    ).json()
    hc = _supplier_headers(client, "c@example.com", "Sup C")

    order = order_via_quote(client, user_headers, admin_headers, pa["id"], 2, "100")
    order_via_quote(client, user_headers, admin_headers, pb["id"], 1, "40")

    a_orders = client.get("/api/supplier/orders", headers=ha).json()
    assert len(a_orders) == 1
    assert a_orders[0]["id"] == order["id"]
    assert a_orders[0]["customer_name"] == "user"
    assert [i["product_name"] for i in a_orders[0]["items"]] == ["A1"]
    assert Decimal(a_orders[0]["supplier_total"]) == Decimal("200")

    b_orders = client.get("/api/supplier/orders", headers=hb).json()
    assert [i["product_name"] for i in b_orders[0]["items"]] == ["B1"]
    assert client.get("/api/supplier/orders", headers=hc).json() == []
