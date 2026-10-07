from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser, Gateway
from app.models import Order, Payment
from app.schemas import OrderOut, PaymentConfirm, PaymentOut
from app.services import orders as order_service
from app.services import payments as payment_service

router = APIRouter(tags=["orders"])


# Orders are created only by accepting a quote (requirements §12, quotation first).
@router.get("/orders", response_model=list[OrderOut])
def my_orders(db: DB, user: CurrentUser) -> list[Order]:
    stmt = select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())
    return list(db.scalars(stmt))


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: DB, user: CurrentUser) -> Order:
    return order_service.get_user_order(db, user, order_id)


@router.post(
    "/orders/{order_id}/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED
)
def start_payment(order_id: int, db: DB, user: CurrentUser, gateway: Gateway) -> Payment:
    order = order_service.get_user_order(db, user, order_id)
    return payment_service.start_payment(db, gateway, order)


@router.get("/orders/{order_id}/payments", response_model=list[PaymentOut])
def order_payments(order_id: int, db: DB, user: CurrentUser) -> list[Payment]:
    order = order_service.get_user_order(db, user, order_id)
    return list(
        db.scalars(select(Payment).where(Payment.order_id == order.id).order_by(Payment.id))
    )


@router.post("/payments/{payment_id}/confirm", response_model=PaymentOut)
def confirm_payment(
    payment_id: int, data: PaymentConfirm, db: DB, user: CurrentUser, gateway: Gateway
) -> Payment:
    return payment_service.confirm_payment(db, gateway, user, payment_id, data)
