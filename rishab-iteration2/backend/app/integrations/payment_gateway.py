import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from app.core.config import get_settings


class PaymentGatewayError(Exception):
    pass


@dataclass
class GatewayPayment:
    provider: str
    reference: str


class PaymentGateway(Protocol):
    name: str

    def create_payment(self, amount: Decimal, currency: str, order_id: int) -> GatewayPayment: ...

    def verify_payment(self, reference: str, payload: dict) -> bool:
        """Return True if the provider confirms the payment succeeded."""
        ...


class MockPaymentGateway:
    """Demo gateway for the prototype. No real money moves."""

    name = "mock"

    def create_payment(self, amount: Decimal, currency: str, order_id: int) -> GatewayPayment:
        return GatewayPayment(provider=self.name, reference=f"mock_{uuid.uuid4().hex}")

    def verify_payment(self, reference: str, payload: dict) -> bool:
        outcome = payload.get("mock_outcome")
        if outcome not in ("success", "failure"):
            raise PaymentGatewayError("mock_outcome must be 'success' or 'failure'")
        return outcome == "success"


def get_payment_gateway() -> PaymentGateway:
    provider = get_settings().payment_provider
    if provider == "mock":
        return MockPaymentGateway()
    raise PaymentGatewayError(f"Unsupported payment provider: {provider}")
