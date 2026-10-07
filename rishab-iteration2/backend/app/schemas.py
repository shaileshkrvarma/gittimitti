from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models import (
    EnquiryStatus,
    NotificationChannel,
    NotificationStatus,
    OrderStatus,
    PaymentStatus,
    QuoteStatus,
    UserRole,
)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth / users
class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{10,15}$")
    password: str = Field(min_length=8, max_length=128)
    role: Literal["user", "supplier"] = "user"
    supplier_name: str | None = Field(default=None, min_length=1, max_length=200)

    @model_validator(mode="after")
    def _supplier_name_required(self) -> "RegisterRequest":
        if self.role == "supplier" and not (self.supplier_name and self.supplier_name.strip()):
            raise ValueError("supplier_name is required when registering as a supplier")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORMModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime


class UserAdminUpdate(BaseModel):
    is_active: bool


# Suppliers
class SupplierBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = None
    is_active: bool | None = None


class SupplierOut(ORMModel, SupplierBase):
    id: int


class SupplierPublic(ORMModel):
    id: int
    name: str


# Categories
class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    is_active: bool | None = None


class CategoryOut(ORMModel, CategoryBase):
    id: int


# Products
class SupplierProductCreate(BaseModel):
    """Product fields a supplier may set; the supplier is taken from the login."""

    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    unit: str = Field(default="piece", min_length=1, max_length=30)
    brand: str | None = Field(default=None, max_length=100)
    grade: str | None = Field(default=None, max_length=100)
    min_order_qty: int = Field(default=1, ge=1, le=1_000_000)
    image_url: str | None = Field(default=None, max_length=500)
    category_id: int
    is_active: bool = True


class ProductCreate(SupplierProductCreate):
    supplier_id: int


class SupplierProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    unit: str | None = Field(default=None, min_length=1, max_length=30)
    brand: str | None = Field(default=None, max_length=100)
    grade: str | None = Field(default=None, max_length=100)
    min_order_qty: int | None = Field(default=None, ge=1, le=1_000_000)
    image_url: str | None = Field(default=None, max_length=500)
    category_id: int | None = None
    is_active: bool | None = None


class ProductUpdate(SupplierProductUpdate):
    supplier_id: int | None = None


class ProductOut(ORMModel):
    id: int
    name: str
    description: str | None
    price: Decimal | None
    unit: str
    brand: str | None
    grade: str | None
    min_order_qty: int
    image_url: str | None
    is_active: bool
    supplier: SupplierPublic
    category: CategoryOut


# Orders
class DeliveryIn(BaseModel):
    delivery_address: str = Field(min_length=5, max_length=500)
    delivery_city: str = Field(min_length=1, max_length=120)
    delivery_district: str = Field(min_length=1, max_length=60)


class OrderItemOut(ORMModel):
    id: int
    product_id: int
    supplier_id: int
    product_name: str
    supplier_name: str
    unit_price: Decimal
    unit: str
    quantity: int
    line_total: Decimal


class DeliveryOut(BaseModel):
    delivery_address: str | None
    delivery_city: str | None
    delivery_district: str | None


class OrderOut(ORMModel, DeliveryOut):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: Decimal
    currency: str
    created_at: datetime
    items: list[OrderItemOut]


class OrderAdminOut(OrderOut):
    user: UserOut


class SupplierOrderOut(DeliveryOut):
    """An order as seen by one supplier: only that supplier's items."""

    id: int
    status: OrderStatus
    created_at: datetime
    customer_name: str
    items: list[OrderItemOut]
    supplier_total: Decimal


# Quotes
class QuoteCreate(DeliveryIn):
    product_id: int
    quantity: int = Field(ge=1, le=1_000_000)
    message: str | None = Field(default=None, max_length=1000)


class QuoteRespond(BaseModel):
    unit_price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    note: str | None = Field(default=None, max_length=1000)


class QuoteOut(ORMModel):
    id: int
    status: QuoteStatus
    product: ProductOut
    customer_name: str
    quantity: int
    delivery_address: str
    delivery_city: str
    delivery_district: str
    message: str | None
    quoted_unit_price: Decimal | None
    quoted_total: Decimal | None
    supplier_note: str | None
    order_id: int | None
    created_at: datetime


# Service enquiries
class EnquiryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    city: str | None = Field(default=None, max_length=120)
    category: str = Field(min_length=1, max_length=80)
    message: str | None = Field(default=None, max_length=2000)


class EnquiryUpdate(BaseModel):
    status: EnquiryStatus


class EnquiryOut(ORMModel):
    id: int
    name: str
    phone: str
    city: str | None
    category: str
    message: str | None
    status: EnquiryStatus
    created_at: datetime


# Payments
class PaymentOut(ORMModel):
    id: int
    order_id: int
    provider: str
    provider_reference: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    created_at: datetime


class PaymentConfirm(BaseModel):
    """Payload returned by the gateway's checkout to the client.

    For the mock gateway, `mock_outcome` simulates what the gateway reports.
    Real gateways (e.g. Razorpay) will send a payment id + signature that the
    server verifies with the provider.
    """

    provider_payment_id: str | None = None
    signature: str | None = None
    mock_outcome: Literal["success", "failure"] | None = None


# Notifications
class NotificationOut(ORMModel):
    id: int
    user_id: int
    channel: NotificationChannel
    event: str
    recipient: str | None
    message: str
    status: NotificationStatus
    error: str | None
    created_at: datetime


class AdminStats(BaseModel):
    users: int
    suppliers: int
    categories: int
    products: int
    orders: int
    paid_orders: int
    revenue: Decimal
