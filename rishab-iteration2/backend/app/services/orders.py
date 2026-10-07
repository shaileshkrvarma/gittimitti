from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import Order, OrderItem, Product, User
from app.schemas import DeliveryIn
from app.services.errors import NotFoundError, ValidationError
from app.services.notifications import notify_user


@dataclass
class Line:
    product: Product
    quantity: int
    unit_price: Decimal


def is_available(product: Product) -> bool:
    return product.is_active and product.supplier.is_active and product.category.is_active


def check_min_qty(product: Product, quantity: int) -> None:
    if quantity < product.min_order_qty:
        raise ValidationError(
            f"Minimum order for {product.name} is {product.min_order_qty} {product.unit}"
        )


def save_order(db: Session, user: User, lines: list[Line], delivery: DeliveryIn) -> Order:
    """Persist an order without committing; caller commits and then calls `notify_order`."""
    order = Order(
        user_id=user.id,
        total_amount=Decimal("0"),
        delivery_address=delivery.delivery_address.strip(),
        delivery_city=delivery.delivery_city.strip(),
        delivery_district=delivery.delivery_district.strip(),
    )
    total = Decimal("0")
    for line in lines:
        p = line.product
        line_total = line.unit_price * line.quantity
        total += line_total
        order.items.append(
            OrderItem(
                product_id=p.id,
                supplier_id=p.supplier_id,
                product_name=p.name,
                supplier_name=p.supplier.name,
                unit_price=line.unit_price,
                unit=p.unit,
                quantity=line.quantity,
                line_total=line_total,
            )
        )
    order.total_amount = total
    db.add(order)
    return order


def notify_order(db: Session, user: User, order: Order) -> None:
    notify_user(
        db,
        user,
        "order_placed",
        f"Your order #{order.id} for INR {order.total_amount} has been placed.",
    )


def get_user_order(db: Session, user: User, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise NotFoundError("Order not found")
    return order
