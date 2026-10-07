from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import DB, AdminUser
from app.models import (
    Category,
    Notification,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    Product,
    Quote,
    ServiceEnquiry,
    Supplier,
    User,
)
from app.schemas import (
    AdminStats,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    EnquiryOut,
    EnquiryUpdate,
    NotificationOut,
    OrderAdminOut,
    PaymentOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    QuoteOut,
    QuoteRespond,
    SupplierCreate,
    SupplierOut,
    SupplierUpdate,
    UserAdminUpdate,
    UserOut,
)
from app.services import crud
from app.services import quotes as quote_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStats)
def stats(db: DB, _: AdminUser) -> AdminStats:
    def count(model) -> int:
        return db.scalar(select(func.count()).select_from(model)) or 0

    paid = select(Order).where(Order.status == OrderStatus.PAID).subquery()
    return AdminStats(
        users=count(User),
        suppliers=count(Supplier),
        categories=count(Category),
        products=count(Product),
        orders=count(Order),
        paid_orders=db.scalar(select(func.count()).select_from(paid)) or 0,
        revenue=db.scalar(select(func.coalesce(func.sum(paid.c.total_amount), 0))) or Decimal("0"),
    )


# Users
@router.get("/users", response_model=list[UserOut])
def list_users(db: DB, _: AdminUser) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)))


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserAdminUpdate, db: DB, admin: AdminUser) -> User:
    user = crud.get_or_404(db, User, user_id)
    if user.id == admin.id and not data.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate yourself")
    return crud.update(db, user, data)


# Suppliers
@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(db: DB, _: AdminUser) -> list[Supplier]:
    return list(db.scalars(select(Supplier).order_by(Supplier.id)))


@router.post("/suppliers", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(data: SupplierCreate, db: DB, _: AdminUser) -> Supplier:
    return crud.create(db, Supplier, data)


@router.patch("/suppliers/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, data: SupplierUpdate, db: DB, _: AdminUser) -> Supplier:
    return crud.update(db, crud.get_or_404(db, Supplier, supplier_id), data)


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: DB, _: AdminUser) -> None:
    obj = crud.get_or_404(db, Supplier, supplier_id)
    crud.delete(db, obj, [Product.supplier_id, OrderItem.supplier_id])


# Categories
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DB, _: AdminUser) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.id)))


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, db: DB, _: AdminUser) -> Category:
    return crud.create(db, Category, data)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, data: CategoryUpdate, db: DB, _: AdminUser) -> Category:
    return crud.update(db, crud.get_or_404(db, Category, category_id), data)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: DB, _: AdminUser) -> None:
    obj = crud.get_or_404(db, Category, category_id)
    crud.delete(db, obj, [Product.category_id])


# Products
def _check_refs(db: DB, supplier_id: int | None, category_id: int | None) -> None:
    if supplier_id is not None and db.get(Supplier, supplier_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Supplier does not exist")
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Category does not exist")


@router.get("/products", response_model=list[ProductOut])
def list_products(db: DB, _: AdminUser) -> list[Product]:
    return list(db.scalars(select(Product).order_by(Product.id)).unique())


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: DB, _: AdminUser) -> Product:
    _check_refs(db, data.supplier_id, data.category_id)
    return crud.create(db, Product, data)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: DB, _: AdminUser) -> Product:
    product = crud.get_or_404(db, Product, product_id)
    _check_refs(db, data.supplier_id, data.category_id)
    return crud.update(db, product, data)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: DB, _: AdminUser) -> None:
    obj = crud.get_or_404(db, Product, product_id)
    crud.delete(db, obj, [OrderItem.product_id])


# Orders & payments (read-only until order/payment workflows are defined)
@router.get("/orders", response_model=list[OrderAdminOut])
def list_orders(db: DB, _: AdminUser) -> list[Order]:
    return list(db.scalars(select(Order).order_by(Order.id.desc())))


@router.get("/orders/{order_id}", response_model=OrderAdminOut)
def get_order(order_id: int, db: DB, _: AdminUser) -> Order:
    return crud.get_or_404(db, Order, order_id)


@router.get("/payments", response_model=list[PaymentOut])
def list_payments(db: DB, _: AdminUser) -> list[Payment]:
    return list(db.scalars(select(Payment).order_by(Payment.id.desc())))


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(db: DB, _: AdminUser) -> list[Notification]:
    return list(db.scalars(select(Notification).order_by(Notification.id.desc()).limit(200)))


# Quotes
@router.get("/quotes", response_model=list[QuoteOut])
def list_quotes(db: DB, _: AdminUser) -> list[Quote]:
    return list(db.scalars(select(Quote).order_by(Quote.id.desc())).unique())


@router.post("/quotes/{quote_id}/respond", response_model=QuoteOut)
def respond_quote(quote_id: int, data: QuoteRespond, db: DB, _: AdminUser) -> Quote:
    return quote_service.respond(db, crud.get_or_404(db, Quote, quote_id), data)


# Service enquiries
@router.get("/enquiries", response_model=list[EnquiryOut])
def list_enquiries(db: DB, _: AdminUser) -> list[ServiceEnquiry]:
    return list(db.scalars(select(ServiceEnquiry).order_by(ServiceEnquiry.id.desc())))


@router.patch("/enquiries/{enquiry_id}", response_model=EnquiryOut)
def update_enquiry(enquiry_id: int, data: EnquiryUpdate, db: DB, _: AdminUser) -> ServiceEnquiry:
    return crud.update(db, crud.get_or_404(db, ServiceEnquiry, enquiry_id), data)
