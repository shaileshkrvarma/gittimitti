from sqlalchemy.orm import Session

from app.integrations.payment_gateway import PaymentGateway, PaymentGatewayError
from app.models import Order, OrderStatus, Payment, PaymentStatus, User
from app.schemas import PaymentConfirm
from app.services.errors import ConflictError, NotFoundError, ValidationError
from app.services.notifications import notify_user


def start_payment(db: Session, gateway: PaymentGateway, order: Order) -> Payment:
    if order.status == OrderStatus.PAID:
        raise ConflictError("Order is already paid")
    gp = gateway.create_payment(order.total_amount, order.currency, order.id)
    payment = Payment(
        order_id=order.id,
        provider=gp.provider,
        provider_reference=gp.reference,
        amount=order.total_amount,
        currency=order.currency,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def confirm_payment(
    db: Session, gateway: PaymentGateway, user: User, payment_id: int, data: PaymentConfirm
) -> Payment:
    payment = db.get(Payment, payment_id)
    if payment is None or payment.order.user_id != user.id:
        raise NotFoundError("Payment not found")
    if payment.status != PaymentStatus.PENDING:
        raise ConflictError("Payment is already processed")
    if payment.provider != gateway.name:
        raise ValidationError("Payment provider mismatch")

    try:
        succeeded = gateway.verify_payment(payment.provider_reference, data.model_dump())
    except PaymentGatewayError as exc:
        raise ValidationError(str(exc)) from exc

    order = payment.order
    if succeeded and order.status == OrderStatus.PAID:
        raise ConflictError("Order is already paid")
    payment.status = PaymentStatus.SUCCEEDED if succeeded else PaymentStatus.FAILED
    if succeeded:
        order.status = OrderStatus.PAID
    db.commit()
    db.refresh(payment)

    if succeeded:
        notify_user(
            db,
            user,
            "payment_succeeded",
            f"Payment of INR {payment.amount} for order #{order.id} was successful.",
        )
    return payment
