import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def _enum(cls: type[enum.Enum]) -> Enum:
    return Enum(cls, native_enum=False, length=20, values_callable=lambda e: [m.value for m in e])


class UserRole(str, enum.Enum):
    USER = "user"
    SUPPLIER = "supplier"
    ADMIN = "admin"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class QuoteStatus(str, enum.Enum):
    REQUESTED = "requested"
    QUOTED = "quoted"
    ACCEPTED = "accepted"


class EnquiryStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CLOSED = "closed"


class NotificationChannel(str, enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"


class NotificationStatus(str, enum.Enum):
    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(_enum(UserRole), default=UserRole.USER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Supplier(TimestampMixin, Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Login account of a self-registered supplier; NULL for admin-created suppliers.
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), unique=True)


class Category(TimestampMixin, Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    # NULL price means "price on request": the item can only be bought through a quote.
    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    unit: Mapped[str] = mapped_column(String(30), default="piece", server_default="piece")
    brand: Mapped[str | None] = mapped_column(String(100))
    grade: Mapped[str | None] = mapped_column(String(100))
    min_order_qty: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    image_url: Mapped[str | None] = mapped_column(String(500))
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    supplier: Mapped[Supplier] = relationship(lazy="joined")
    category: Mapped[Category] = relationship(lazy="joined")


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[OrderStatus] = mapped_column(_enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    delivery_address: Mapped[str | None] = mapped_column(Text)
    delivery_city: Mapped[str | None] = mapped_column(String(120))
    delivery_district: Mapped[str | None] = mapped_column(String(60))

    user: Mapped[User] = relationship()
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    product_name: Mapped[str] = mapped_column(String(200))
    supplier_name: Mapped[str] = mapped_column(String(200))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit: Mapped[str] = mapped_column(String(30), default="piece", server_default="piece")
    quantity: Mapped[int] = mapped_column(Integer)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    order: Mapped[Order] = relationship(back_populates="items")


class Quote(TimestampMixin, Base):
    """A customer's request for a price on one product; becomes an order once accepted."""

    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer)
    delivery_address: Mapped[str] = mapped_column(Text)
    delivery_city: Mapped[str] = mapped_column(String(120))
    delivery_district: Mapped[str] = mapped_column(String(60))
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[QuoteStatus] = mapped_column(_enum(QuoteStatus), default=QuoteStatus.REQUESTED)
    quoted_unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    supplier_note: Mapped[str | None] = mapped_column(Text)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id"))

    user: Mapped[User] = relationship(lazy="joined")
    product: Mapped[Product] = relationship(lazy="joined")

    @property
    def customer_name(self) -> str:
        return self.user.full_name

    @property
    def quoted_total(self) -> Decimal | None:
        if self.quoted_unit_price is None:
            return None
        return self.quoted_unit_price * self.quantity


class ServiceEnquiry(Base):
    """Public enquiry form (construction services, materials, etc.)."""

    __tablename__ = "service_enquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    city: Mapped[str | None] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(80))
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[EnquiryStatus] = mapped_column(_enum(EnquiryStatus), default=EnquiryStatus.NEW)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True)
    provider: Mapped[str] = mapped_column(String(30))
    provider_reference: Mapped[str] = mapped_column(String(100), unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    status: Mapped[PaymentStatus] = mapped_column(
        _enum(PaymentStatus), default=PaymentStatus.PENDING
    )

    order: Mapped[Order] = relationship()


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    channel: Mapped[NotificationChannel] = mapped_column(_enum(NotificationChannel))
    event: Mapped[str] = mapped_column(String(50))
    recipient: Mapped[str | None] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[NotificationStatus] = mapped_column(_enum(NotificationStatus))
    error: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
