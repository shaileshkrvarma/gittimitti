from decimal import Decimal

from tests.conftest import DELIVERY, _auth, _make_user, order_via_quote


def _product(client, admin_headers, catalog, **extra):
    body = {
        "name": "TMT Bar 12mm",
        "unit": "tonne",
        "brand": "Tata Tiscon",
        "grade": "Fe-500D",
        "min_order_qty": 2,
        "supplier_id": catalog["suppliers"][0]["id"],
        "category_id": catalog["category"]["id"],
        **extra,
    }
    r = client.post("/api/admin/products", json=body, headers=admin_headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_product_material_fields_and_price_on_request(client, admin_headers, catalog):
    p = _product(client, admin_headers, catalog)
    assert p["price"] is None
    assert (p["unit"], p["brand"], p["grade"], p["min_order_qty"]) == (
        "tonne",
        "Tata Tiscon",
        "Fe-500D",
        2,
    )
    public = next(x for x in client.get("/api/products").json() if x["id"] == p["id"])
    assert public["price"] is None


def test_priced_item_is_also_bought_through_a_quote(client, admin_headers, user_headers, catalog):
    bricks = _product(
        client, admin_headers, catalog, name="Bricks", unit="piece", price="8", min_order_qty=1000
    )
    base = {**DELIVERY, "product_id": bricks["id"]}
    r = client.post("/api/quotes", json={**base, "quantity": 999}, headers=user_headers)
    assert r.status_code == 422 and "Minimum order" in r.json()["detail"]
    no_delivery = {"product_id": bricks["id"], "quantity": 5000}
    assert client.post("/api/quotes", json=no_delivery, headers=user_headers).status_code == 422
    order = order_via_quote(client, user_headers, admin_headers, bricks["id"], 5000, "7.50")
    assert Decimal(order["total_amount"]) == Decimal("37500")
    assert order["items"][0]["unit"] == "piece"
    assert order["delivery_city"] == "Samastipur"


def test_quote_flow_supplier_price_customer_accepts(
    client, db, admin_headers, user_headers, catalog
):
    # supplier login linked to Supplier A
    sup = client.post(
        "/api/auth/register",
        json={
            "full_name": "Kiln",
            "email": "kiln@example.com",
            "password": "password123",
            "role": "supplier",
            "supplier_name": "Kiln Co",
        },
    )
    assert sup.status_code == 201
    sh = _auth(client, "kiln@example.com")
    cat_id = catalog["category"]["id"]
    product = client.post(
        "/api/supplier/products",
        json={"name": "Sand", "unit": "trolley", "category_id": cat_id},
        headers=sh,
    ).json()

    r = client.post(
        "/api/quotes",
        json={**DELIVERY, "product_id": product["id"], "quantity": 3, "message": "Urgent"},
        headers=user_headers,
    )
    assert r.status_code == 201, r.text
    quote = r.json()
    assert quote["status"] == "requested" and quote["quoted_total"] is None

    # cannot accept before a price is given
    assert client.post(f"/api/quotes/{quote['id']}/accept", headers=user_headers).status_code == 409

    # other suppliers cannot see or answer it
    other_sh = client.post(
        "/api/auth/register",
        json={
            "full_name": "O",
            "email": "o@example.com",
            "password": "password123",
            "role": "supplier",
            "supplier_name": "Other Co",
        },
    )
    assert other_sh.status_code == 201
    oh = _auth(client, "o@example.com")
    assert client.get("/api/supplier/quotes", headers=oh).json() == []
    r = client.post(
        f"/api/supplier/quotes/{quote['id']}/respond", json={"unit_price": "1"}, headers=oh
    )
    assert r.status_code == 404

    listed = client.get("/api/supplier/quotes", headers=sh).json()
    assert [q["id"] for q in listed] == [quote["id"]]
    assert listed[0]["customer_name"] == "user"
    r = client.post(
        f"/api/supplier/quotes/{quote['id']}/respond",
        json={"unit_price": "2500", "note": "Delivery in 2 days"},
        headers=sh,
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "quoted"
    assert Decimal(r.json()["quoted_total"]) == Decimal("7500")

    r = client.post(f"/api/quotes/{quote['id']}/accept", headers=user_headers)
    assert r.status_code == 200, r.text
    accepted = r.json()
    assert accepted["status"] == "accepted" and accepted["order_id"]

    order = client.get(f"/api/orders/{accepted['order_id']}", headers=user_headers).json()
    assert Decimal(order["total_amount"]) == Decimal("7500")
    assert order["items"][0]["unit"] == "trolley"
    assert order["delivery_address"] == DELIVERY["delivery_address"]
    sup_orders = client.get("/api/supplier/orders", headers=sh).json()
    assert sup_orders[0]["id"] == order["id"]
    assert sup_orders[0]["delivery_city"] == "Samastipur"

    # accepted quotes are final
    assert client.post(f"/api/quotes/{quote['id']}/accept", headers=user_headers).status_code == 409
    r = client.post(
        f"/api/supplier/quotes/{quote['id']}/respond", json={"unit_price": "1"}, headers=sh
    )
    assert r.status_code == 409


def test_quote_validation_and_ownership(client, db, admin_headers, user_headers, catalog):
    p = _product(client, admin_headers, catalog)
    base = {**DELIVERY, "product_id": p["id"]}
    assert client.post("/api/quotes", json={**base, "quantity": 2}).status_code == 401
    r = client.post("/api/quotes", json={**base, "quantity": 1}, headers=user_headers)
    assert r.status_code == 422
    r = client.post(
        "/api/quotes", json={**base, "product_id": 999, "quantity": 2}, headers=user_headers
    )
    assert r.status_code == 422
    quote = client.post("/api/quotes", json={**base, "quantity": 2}, headers=user_headers).json()

    _make_user(db, "x@example.com")
    xh = _auth(client, "x@example.com")
    assert client.get(f"/api/quotes/{quote['id']}", headers=xh).status_code == 404
    assert client.post(f"/api/quotes/{quote['id']}/accept", headers=xh).status_code == 404

    # admin can price any quote
    assert client.get("/api/admin/quotes", headers=user_headers).status_code == 403
    assert len(client.get("/api/admin/quotes", headers=admin_headers).json()) == 1
    r = client.post(
        f"/api/admin/quotes/{quote['id']}/respond", json={"unit_price": "0"}, headers=admin_headers
    )
    assert r.status_code == 422
    r = client.post(
        f"/api/admin/quotes/{quote['id']}/respond",
        json={"unit_price": "60000"},
        headers=admin_headers,
    )
    assert r.status_code == 200 and r.json()["status"] == "quoted"


def test_service_enquiry_public_and_admin(client, user_headers, admin_headers):
    body = {
        "name": "Ramesh",
        "phone": "+919654399439",
        "city": "Tajpur",
        "category": "House Construction",
        "message": "2BHK on 1000 sqft",
    }
    r = client.post("/api/enquiries", json=body)
    assert r.status_code == 201, r.text
    assert r.json()["status"] == "new"
    assert client.post("/api/enquiries", json={**body, "phone": "123"}).status_code == 422
    assert client.post("/api/enquiries", json={**body, "category": ""}).status_code == 422

    assert client.get("/api/admin/enquiries").status_code == 401
    assert client.get("/api/admin/enquiries", headers=user_headers).status_code == 403
    rows = client.get("/api/admin/enquiries", headers=admin_headers).json()
    assert rows[0]["name"] == "Ramesh"
    r = client.patch(
        f"/api/admin/enquiries/{rows[0]['id']}", json={"status": "contacted"}, headers=admin_headers
    )
    assert r.status_code == 200 and r.json()["status"] == "contacted"
    r = client.patch(
        f"/api/admin/enquiries/{rows[0]['id']}", json={"status": "bogus"}, headers=admin_headers
    )
    assert r.status_code == 422
