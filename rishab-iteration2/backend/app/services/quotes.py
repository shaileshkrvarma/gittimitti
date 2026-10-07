from sqlalchemy.orm import Session

from app.models import Product, Quote, QuoteStatus, User
from app.schemas import QuoteCreate, QuoteRespond
from app.services.errors import ConflictError, NotFoundError, ValidationError
from app.services.notifications import notify_user
from app.services.orders import Line, check_min_qty, is_available, notify_order, save_order


def create_quote(db: Session, user: User, data: QuoteCreate) -> Quote:
    product = db.get(Product, data.product_id)
    if product is None or not is_available(product):
        raise ValidationError("Product not available")
    check_min_qty(product, data.quantity)
    quote = Quote(
        user_id=user.id,
        product_id=product.id,
        supplier_id=product.supplier_id,
        quantity=data.quantity,
        delivery_address=data.delivery_address.strip(),
        delivery_city=data.delivery_city.strip(),
        delivery_district=data.delivery_district.strip(),
        message=data.message,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def respond(db: Session, quote: Quote, data: QuoteRespond) -> Quote:
    if quote.status == QuoteStatus.ACCEPTED:
        raise ConflictError("Quote already accepted")
    quote.quoted_unit_price = data.unit_price
    quote.supplier_note = data.note
    quote.status = QuoteStatus.QUOTED
    db.commit()
    db.refresh(quote)
    notify_user(
        db,
        quote.user,
        "quote_received",
        f"Quote #{quote.id} for {quote.product.name}: INR {quote.quoted_total}.",
    )
    return quote


def get_user_quote(db: Session, user: User, quote_id: int) -> Quote:
    quote = db.get(Quote, quote_id)
    if quote is None or quote.user_id != user.id:
        raise NotFoundError("Quote not found")
    return quote


def accept(db: Session, user: User, quote_id: int) -> Quote:
    quote = get_user_quote(db, user, quote_id)
    if quote.status != QuoteStatus.QUOTED:
        raise ConflictError("Quote has no price yet or is already accepted")
    if not is_available(quote.product):
        raise ValidationError("Product not available")
    order = save_order(
        db, user, [Line(quote.product, quote.quantity, quote.quoted_unit_price)], quote
    )
    db.flush()
    quote.order_id = order.id
    quote.status = QuoteStatus.ACCEPTED
    db.commit()
    db.refresh(quote)
    notify_order(db, user, order)
    return quote
