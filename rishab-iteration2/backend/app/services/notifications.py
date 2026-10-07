import logging

from sqlalchemy.orm import Session

from app.integrations.notifications import NotificationSender, get_notification_senders
from app.models import Notification, NotificationChannel, NotificationStatus, User

logger = logging.getLogger(__name__)


def _recipient(user: User, channel: NotificationChannel) -> str | None:
    if channel == NotificationChannel.EMAIL:
        return user.email
    return user.phone


def notify_user(
    db: Session,
    user: User,
    event: str,
    message: str,
    senders: list[NotificationSender] | None = None,
) -> list[Notification]:
    """Send on every channel and record the result.

    Must be called after the business transaction is committed; failures here
    are recorded and never propagated.
    """
    senders = senders if senders is not None else get_notification_senders()
    records: list[Notification] = []
    for sender in senders:
        recipient = _recipient(user, sender.channel)
        status, error = NotificationStatus.SENT, None
        if not recipient:
            status, error = NotificationStatus.SKIPPED, "No recipient for channel"
        else:
            try:
                sender.send(recipient, message)
            except Exception as exc:  # provider failures must not break the caller
                logger.warning("Notification via %s failed: %s", sender.channel.value, exc)
                status, error = NotificationStatus.FAILED, str(exc)[:500]
        records.append(
            Notification(
                user_id=user.id,
                channel=sender.channel,
                event=event,
                recipient=recipient,
                message=message,
                status=status,
                error=error,
            )
        )
    try:
        db.add_all(records)
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to record notifications for user %s", user.id)
    return records
