from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.models import Quote, ServiceEnquiry
from app.schemas import EnquiryCreate, EnquiryOut, QuoteCreate, QuoteOut
from app.services import quotes as quote_service

router = APIRouter(tags=["quotes"])


@router.post("/quotes", response_model=QuoteOut, status_code=status.HTTP_201_CREATED)
def request_quote(data: QuoteCreate, db: DB, user: CurrentUser) -> Quote:
    return quote_service.create_quote(db, user, data)


@router.get("/quotes", response_model=list[QuoteOut])
def my_quotes(db: DB, user: CurrentUser) -> list[Quote]:
    stmt = select(Quote).where(Quote.user_id == user.id).order_by(Quote.id.desc())
    return list(db.scalars(stmt).unique())


@router.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int, db: DB, user: CurrentUser) -> Quote:
    return quote_service.get_user_quote(db, user, quote_id)


@router.post("/quotes/{quote_id}/accept", response_model=QuoteOut)
def accept_quote(quote_id: int, db: DB, user: CurrentUser) -> Quote:
    return quote_service.accept(db, user, quote_id)


@router.post("/enquiries", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
def create_enquiry(data: EnquiryCreate, db: DB) -> ServiceEnquiry:
    enquiry = ServiceEnquiry(**data.model_dump())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry
