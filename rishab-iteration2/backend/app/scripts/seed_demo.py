"""Insert a sample building-materials catalogue for local demos (only if no products exist).

Categories follow gittimitti.com. Prices are demo values, not real quotes.
If DEMO_SUPPLIER_PASSWORD is set, a login is created for each demo supplier
(<slug>@example.com) so the supplier dashboard can be shown.

Usage: python -m app.scripts.seed_demo
"""

import os
from decimal import Decimal

from sqlalchemy import func, select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models import Category, Product, Supplier, User, UserRole

CATEGORIES = {
    "Bricks": "Red clay bricks, kiln-fired",
    "Cement": "OPC / PPC cement",
    "TMT Steel": "TMT steel bars",
    "Sand & Aggregate": "River sand, M-sand, graded aggregate",
    "Tiles": "Floor and wall tiles",
    "Roofing Sheets": "GI, colour-coated and PVC sheets",
    "Paints": "Paints and primers",
    "Plumbing & Electrical": "Pipes, fittings, switches, wiring",
}

SUPPLIERS = [
    ("GittiMitti Infratech", "gittimitti", "Atul Prakash", "Samastipur, Bihar"),
    ("Sample Kiln & Aggregates (demo)", "samplekiln", "Demo Owner", "Samastipur, Bihar"),
]

# (supplier index, category, name, brand, grade, unit, price or None, min qty)
PRODUCTS = [
    (0, "Cement", "OPC 53 Grade Cement", "UltraTech", "OPC 53", "bag", "420", 10),
    (0, "Cement", "PPC Cement", "ACC", "PPC", "bag", "390", 10),
    (0, "TMT Steel", "TMT Bar 12mm", "Tata Tiscon", "Fe-500D", "tonne", None, 1),
    (0, "Tiles", "Vitrified Floor Tile 2x2 ft", "Kajaria", "600x600 mm", "box", "780", 5),
    (0, "Roofing Sheets", "Colour-coated GI Sheet", None, "0.45 mm", "sheet", "1150", 5),
    (0, "Paints", "Exterior Emulsion 20L", "Asian Paints", "Apex", "bucket", "5400", 1),
    (0, "Plumbing & Electrical", "CPVC Pipe 1 inch", "Astral", "SDR 11", "piece", "640", 5),
    (1, "Bricks", "Red Clay Bricks", None, "Standard 9x4x3 in", "piece", "9", 1000),
    (1, "Sand & Aggregate", "River Sand", None, "Fine", "trolley", None, 1),
    (1, "Sand & Aggregate", "Stone Aggregate (Gitti) 20mm", None, "20 mm", "trolley", None, 1),
]


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Product)):
            print("Products already exist; skipping demo seed")
            return
        password = os.environ.get("DEMO_SUPPLIER_PASSWORD")
        cats = {}
        for name, desc in CATEGORIES.items():
            cats[name] = db.scalar(select(Category).where(Category.name == name)) or Category(
                name=name, description=desc
            )
        suppliers = []
        for name, slug, person, address in SUPPLIERS:
            supplier = Supplier(name=name, email=f"{slug}@example.com", address=address)
            if password:
                user = User(
                    full_name=person,
                    email=f"{slug}@example.com",
                    password_hash=hash_password(password),
                    role=UserRole.SUPPLIER,
                )
                db.add(user)
                db.flush()
                supplier.user_id = user.id
            suppliers.append(supplier)
        db.add_all([*cats.values(), *suppliers])
        db.flush()
        for s_idx, cat, name, brand, grade, unit, price, min_qty in PRODUCTS:
            db.add(
                Product(
                    name=name,
                    brand=brand,
                    grade=grade,
                    unit=unit,
                    price=Decimal(price) if price else None,
                    min_order_qty=min_qty,
                    supplier=suppliers[s_idx],
                    category=cats[cat],
                    description="Demo listing",
                )
            )
        db.commit()
        print("Demo data inserted")


if __name__ == "__main__":
    main()
