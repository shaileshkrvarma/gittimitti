import logging
from typing import Protocol

from app.core.config import get_settings
from app.models import NotificationChannel

logger = logging.getLogger(__name__)


class NotificationSender(Protocol):
    channel: NotificationChannel

    def send(self, recipient: str, message: str) -> None:
        """Send a message; raise on failure."""
        ...


class MockSender:
    """Logs instead of sending. Used until real providers are selected."""

    def __init__(self, channel: NotificationChannel) -> None:
        self.channel = channel

    def send(self, recipient: str, message: str) -> None:
        logger.info("[mock %s] to=%s message=%s", self.channel.value, recipient, message)


def get_notification_senders() -> list[NotificationSender]:
    provider = get_settings().notification_provider
    if provider == "mock":
        return [MockSender(c) for c in NotificationChannel]
    raise ValueError(f"Unsupported notification provider: {provider}")
