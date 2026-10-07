import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin, auth, catalog, orders, quotes, supplier
from app.core.config import get_settings
from app.services.errors import ServiceError

logging.basicConfig(level=logging.INFO)

settings = get_settings()
app = FastAPI(title="Real Estate Marketplace API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ServiceError)
def handle_service_error(_: Request, exc: ServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


for r in (auth.router, catalog.router, orders.router, quotes.router, supplier.router, admin.router):
    app.include_router(r, prefix="/api")
