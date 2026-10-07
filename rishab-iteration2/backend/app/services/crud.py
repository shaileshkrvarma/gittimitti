from typing import TypeVar

from pydantic import BaseModel
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.db import Base
from app.services.errors import ConflictError, NotFoundError

M = TypeVar("M", bound=Base)


def get_or_404(db: Session, model: type[M], obj_id: int) -> M:
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFoundError(f"{model.__name__} not found")
    return obj


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ConflictError("Conflicts with existing data (duplicate name?)") from exc


def create(db: Session, model: type[M], data: BaseModel) -> M:
    obj = model(**data.model_dump())
    db.add(obj)
    _commit(db)
    db.refresh(obj)
    return obj


def update(db: Session, obj: M, data: BaseModel) -> M:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    _commit(db)
    db.refresh(obj)
    return obj


def delete(db: Session, obj: Base, referenced_by: list) -> None:
    """Delete unless any of `referenced_by` (FK columns) point at it."""
    for column in referenced_by:
        if db.scalar(select(exists().where(column == obj.id))):
            raise ConflictError("In use; deactivate it instead of deleting")
    db.delete(obj)
    db.commit()
