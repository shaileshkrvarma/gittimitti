from decimal import Decimal

import pytest

from app.models import NotificationChannel
from tests.conftest import DELIVERY, order_via_quote


@pytest.fixture()
def order(client, user_headers, admin_headers, catalog):
    return order_via_quote(
        client, user_headers, admin_headers, catalog["products"][0]["id"], 3, "1083.83"
    )


def test_direct_order_creation_is_not_allowed(client, user_headers, catalog):
    body = {**DELIVERY, "items": [{"product_id": catalog["products"][0]["id"], "quantity": 1}]}
    assert client.post("/api/orders", json=body, headers=user_headers).status_code == 405


def test_orders_from_quotes_keep_suppliers(client, user_headers, admin_headers, catalog):
    p1, p2 = catalog["products"]
    o1 = order_via_quote(client, user_headers, admin_headers, p1["id"], 3, "1000.50")
    o2 = order_via_quote(client, user_headers, admin_headers, p2["id"], 1, "250")
    assert o1["status"] == "pending"
    assert Decimal(o1["total_amount"]) == Decimal("3001.50")
    assert o1["items"][0]["supplier_name"] == "Supplier A" and o1["items"][0]["quantity"] == 3
    assert o2["items"][0]["supplier_name"] == "Supplier B"
    mine = client.get("/api/orders", headers=user_headers).json()
    assert [o["id"] for o in mine] == [o2["id"], o1["id"]]


def test_order_price_snapshot(client, user_headers, admin_headers, catalog, order):
    pid = catalog["products"][0]["id"]
    client.patch(f"/api/admin/products/{pid}", json={"price": "1"}, headers=admin_headers)
    again = client.get(f"/api/orders/{order['id']}", headers=user_headers).json()
    assert again["total_amount"] == order["total_amount"] == "3251.49"


def test_order_requires_auth_and_ownership(client, user_headers, other_user_headers, order):
    assert client.get("/api/orders").status_code == 401
    assert client.get(f"/api/orders/{order['id']}", headers=other_user_headers).status_code == 404
    r = client.post(f"/api/orders/{order['id']}/payments", headers=other_user_headers)
    assert r.status_code == 404


def test_payment_success_flow(client, user_headers, admin_headers, order):
    pay = client.post(f"/api/orders/{order['id']}/payments", headers=user_headers)
    assert pay.status_code == 201
    payment = pay.json()
    assert payment["status"] == "pending" and payment["amount"] == order["total_amount"]

    r = client.post(
        f"/api/payments/{payment['id']}/confirm",
        json={"mock_outcome": "success"},
        headers=user_headers,
    )
    assert r.status_code == 200 and r.json()["status"] == "succeeded"
    assert client.get(f"/api/orders/{order['id']}", headers=user_headers).json()["status"] == "paid"

    again = client.post(
        f"/api/payments/{payment['id']}/confirm",
        json={"mock_outcome": "success"},
        headers=user_headers,
    )
    assert again.status_code == 409
    assert (
        client.post(f"/api/orders/{order['id']}/payments", headers=user_headers).status_code == 409
    )

    events = {
        n["event"] for n in client.get("/api/admin/notifications", headers=admin_headers).json()
    }
    assert events == {"quote_received", "order_placed", "payment_succeeded"}
    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["paid_orders"] == 1 and Decimal(str(stats["revenue"])) == Decimal("3251.49")


def test_payment_failure_then_retry(client, user_headers, order):
    p = client.post(f"/api/orders/{order['id']}/payments", headers=user_headers).json()
    r = client.post(
        f"/api/payments/{p['id']}/confirm", json={"mock_outcome": "failure"}, headers=user_headers
    )
    assert r.json()["status"] == "failed"
    assert (
        client.get(f"/api/orders/{order['id']}", headers=user_headers).json()["status"] == "pending"
    )
    p2 = client.post(f"/api/orders/{order['id']}/payments", headers=user_headers)
    assert p2.status_code == 201


def test_payment_confirm_validation_and_ownership(client, user_headers, other_user_headers, order):
    p = client.post(f"/api/orders/{order['id']}/payments", headers=user_headers).json()
    url = f"/api/payments/{p['id']}/confirm"
    assert client.post(url, json={}, headers=user_headers).status_code == 422
    r = client.post(url, json={"mock_outcome": "success"}, headers=other_user_headers)
    assert r.status_code == 404


class _FailingSender:
    channel = NotificationChannel.SMS

    def send(self, recipient, message):
        raise RuntimeError("provider down")


def test_notification_failure_does_not_break_order(client, user_headers, admin_headers, catalog):
    import app.services.notifications as svc

    original = svc.get_notification_senders
    svc.get_notification_senders = lambda: [_FailingSender()]
    try:
        order = order_via_quote(client, user_headers, admin_headers, catalog["products"][0]["id"])
    finally:
        svc.get_notification_senders = original
    assert order["status"] == "pending"
    notes = client.get("/api/admin/notifications", headers=admin_headers).json()
    assert notes[0]["status"] == "failed" and notes[0]["error"] == "provider down"
