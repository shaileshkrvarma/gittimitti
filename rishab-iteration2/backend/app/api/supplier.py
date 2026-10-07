from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentSupplier
from app.models import Category, Order, OrderItem, Product, Quote, Supplier
from app.schemas import (
    ProductOut,
    QuoteOut,
    QuoteRespond,
    SupplierOrderOut,
    SupplierOut,
    SupplierProductCreate,
    SupplierProductUpdate,
)
from app.services import crud
from app.services import quotes as quote_service

router = APIRouter(prefix="/supplier", tags=["supplier"])


def _check_category(db: DB, category_id: int | None) -> None:
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Category does not exist")


def _own_product(db: DB, supplier: Supplier, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None or product.supplier_id != supplier.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return product


@router.get("/profile", response_model=SupplierOut)
def profile(supplier: CurrentSupplier) -> Supplier:
    return supplier


@router.get("/products", response_model=list[ProductOut])
def my_products(db: DB, supplier: CurrentSupplier) -> list[Product]:
    stmt = select(Product).where(Product.supplier_id == supplier.id).order_by(Product.id)
    return list(db.scalars(stmt).unique())


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: SupplierProductCreate, db: DB, supplier: CurrentSupplier) -> Product:
    _check_category(db, data.category_id)
    product = Product(**data.model_dump(), supplier_id=supplier.id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int, data: SupplierProductUpdate, db: DB, supplier: CurrentSupplier
) -> Product:
    product = _own_product(db, supplier, product_id)
    _check_category(db, data.category_id)
    return crud.update(db, product, data)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: DB, supplier: CurrentSupplier) -> None:
    crud.delete(db, _own_product(db, supplier, product_id), [OrderItem.product_id])


@router.get("/orders", response_model=list[SupplierOrderOut])
def my_orders(db: DB, supplier: CurrentSupplier) -> list[SupplierOrderOut]:
    stmt = (
        select(Order)
        .where(Order.items.any(OrderItem.supplier_id == supplier.id))
        .order_by(Order.id.desc())
    )
    result = []
    for order in db.scalars(stmt):
        items = [i for i in order.items if i.supplier_id == supplier.id]
        result.append(
            SupplierOrderOut(
                id=order.id,
                status=order.status,
                created_at=order.created_at,
                customer_name=order.user.full_name,
                delivery_address=order.delivery_address,
                delivery_city=order.delivery_city,
                delivery_district=order.delivery_district,
                items=items,
                supplier_total=sum((i.line_total for i in items), start=0),
            )
        )
    return result


@router.get("/quotes", response_model=list[QuoteOut])
def my_quotes(db: DB, supplier: CurrentSupplier) -> list[Quote]:
    stmt = select(Quote).where(Quote.supplier_id == supplier.id).order_by(Quote.id.desc())
    return list(db.scalars(stmt).unique())


@router.post("/quotes/{quote_id}/respond", response_model=QuoteOut)
def respond_quote(quote_id: int, data: QuoteRespond, db: DB, supplier: CurrentSupplier) -> Quote:
    quote = db.get(Quote, quote_id)
    if quote is None or quote.supplier_id != supplier.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Quote not found")
    return quote_service.respond(db, quote, data)
