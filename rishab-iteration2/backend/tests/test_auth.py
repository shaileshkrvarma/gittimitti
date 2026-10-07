def test_register_login_me(client):
    r = client.post(
        "/api/auth/register",
        json={"full_name": "Asha", "email": "Asha@Example.com", "password": "password123"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "asha@example.com"
    assert body["role"] == "user"
    assert "password_hash" not in body

    r = client.post(
        "/api/auth/login", json={"email": "asha@example.com", "password": "password123"}
    )
    token = r.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["full_name"] == "Asha"


def test_register_duplicate_email(client):
    data = {"full_name": "A", "email": "a@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=data).status_code == 201
    assert client.post("/api/auth/register", json=data).status_code == 409


def test_register_validation(client):
    r = client.post(
        "/api/auth/register", json={"full_name": "A", "email": "bad", "password": "short"}
    )
    assert r.status_code == 422
    r = client.post(
        "/api/auth/register",
        json={"full_name": "A", "email": "a@example.com", "password": "password123", "phone": "x"},
    )
    assert r.status_code == 422


def test_login_wrong_password(client, user_headers):
    r = client.post("/api/auth/login", json={"email": "user@example.com", "password": "nope12345"})
    assert r.status_code == 401


def test_me_requires_auth(client):
    assert client.get("/api/auth/me").status_code == 401
    bad = {"Authorization": "Bearer not-a-token"}
    assert client.get("/api/auth/me", headers=bad).status_code == 401


def test_deactivated_user_blocked(client, db, user_headers, admin_headers):
    users = client.get("/api/admin/users", headers=admin_headers).json()
    uid = next(u["id"] for u in users if u["email"] == "user@example.com")
    r = client.patch(f"/api/admin/users/{uid}", json={"is_active": False}, headers=admin_headers)
    assert r.status_code == 200
    assert client.get("/api/auth/me", headers=user_headers).status_code == 401
    r = client.post(
        "/api/auth/login", json={"email": "user@example.com", "password": "password123"}
    )
    assert r.status_code == 403
