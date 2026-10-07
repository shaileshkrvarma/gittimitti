ADMIN_LISTS = [
    "/api/admin/stats",
    "/api/admin/users",
    "/api/admin/suppliers",
    "/api/admin/categories",
    "/api/admin/products",
    "/api/admin/orders",
    "/api/admin/payments",
    "/api/admin/notifications",
]


def test_admin_endpoints_require_admin(client, user_headers):
    for path in ADMIN_LISTS:
        assert client.get(path).status_code == 401, path
        assert client.get(path, headers=user_headers).status_code == 403, path
    r = client.post("/api/admin/categories", json={"name": "X"}, headers=user_headers)
    assert r.status_code == 403


def test_admin_lists(client, admin_headers, catalog):
    for path in ADMIN_LISTS:
        assert client.get(path, headers=admin_headers).status_code == 200, path


def test_category_crud_and_duplicates(client, admin_headers):
    h = admin_headers
    c = client.post("/api/admin/categories", json={"name": "Villas"}, headers=h)
    assert c.status_code == 201
    cid = c.json()["id"]
    assert (
        client.post("/api/admin/categories", json={"name": "Villas"}, headers=h).status_code == 409
    )
    r = client.patch(f"/api/admin/categories/{cid}", json={"description": "d"}, headers=h)
    assert r.json()["description"] == "d"
    assert client.delete(f"/api/admin/categories/{cid}", headers=h).status_code == 204
    assert client.delete(f"/api/admin/categories/{cid}", headers=h).status_code == 404


def test_delete_in_use_is_conflict(client, admin_headers, catalog):
    h = admin_headers
    sid = catalog["suppliers"][0]["id"]
    cid = catalog["category"]["id"]
    assert client.delete(f"/api/admin/suppliers/{sid}", headers=h).status_code == 409
    assert client.delete(f"/api/admin/categories/{cid}", headers=h).status_code == 409


def test_product_validation(client, admin_headers, catalog):
    h = admin_headers
    base = {
        "name": "X",
        "price": "10",
        "supplier_id": 999,
        "category_id": catalog["category"]["id"],
    }
    assert client.post("/api/admin/products", json=base, headers=h).status_code == 422
    base["supplier_id"] = catalog["suppliers"][0]["id"]
    assert (
        client.post("/api/admin/products", json={**base, "price": "0"}, headers=h).status_code
        == 422
    )
    assert client.post("/api/admin/products", json=base, headers=h).status_code == 201


def test_admin_cannot_deactivate_self(client, admin_headers):
    me = client.get("/api/auth/me", headers=admin_headers).json()
    r = client.patch(
        f"/api/admin/users/{me['id']}", json={"is_active": False}, headers=admin_headers
    )
    assert r.status_code == 400
