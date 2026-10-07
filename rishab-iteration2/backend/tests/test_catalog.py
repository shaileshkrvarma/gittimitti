def test_public_catalog(client, catalog):
    r = client.get("/api/products")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert names == ["P1", "P2"]
    assert r.json()[0]["supplier"] == {"id": catalog["suppliers"][0]["id"], "name": "Supplier A"}
    assert len(client.get("/api/suppliers").json()) == 2
    assert len(client.get("/api/categories").json()) == 1


def test_filters(client, catalog):
    sid = catalog["suppliers"][1]["id"]
    assert [p["name"] for p in client.get(f"/api/products?supplier_id={sid}").json()] == ["P2"]
    assert [p["name"] for p in client.get("/api/products?q=p1").json()] == ["P1"]


def test_inactive_hidden(client, admin_headers, catalog):
    pid = catalog["products"][0]["id"]
    client.patch(f"/api/admin/products/{pid}", json={"is_active": False}, headers=admin_headers)
    assert [p["name"] for p in client.get("/api/products").json()] == ["P2"]
    assert client.get(f"/api/products/{pid}").status_code == 404

    sid = catalog["suppliers"][1]["id"]
    client.patch(f"/api/admin/suppliers/{sid}", json={"is_active": False}, headers=admin_headers)
    assert client.get("/api/products").json() == []
