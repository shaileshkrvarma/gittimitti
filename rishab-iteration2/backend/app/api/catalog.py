from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from app.api.deps import DB
from app.models import Category, Product, Supplier
from app.schemas import CategoryOut, ProductOut, SupplierPublic

router = APIRouter(tags=["catalog"])


def _available():
    return (
        select(Product)
        .join(Product.supplier)
        .join(Product.category)
        .where(Product.is_active, Supplier.is_active, Category.is_active)
    )


@router.get("/products", response_model=list[ProductOut])
def list_products(
    db: DB,
    category_id: int | None = None,
    supplier_id: int | None = None,
    q: str | None = Query(default=None, max_length=100),
) -> list[Product]:
    stmt = _available()
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if supplier_id:
        stmt = stmt.where(Product.supplier_id == supplier_id)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))
    return list(db.scalars(stmt.order_by(Product.id)).unique())


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: DB) -> Product:
    product = db.scalars(_available().where(Product.id == product_id)).unique().first()
    if product is None:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DB) -> list[Category]:
    return list(db.scalars(select(Category).where(Category.is_active).order_by(Category.name)))


@router.get("/suppliers", response_model=list[SupplierPublic])
def list_suppliers(db: DB) -> list[Supplier]:
    return list(db.scalars(select(Supplier).where(Supplier.is_active).order_by(Supplier.name)))
