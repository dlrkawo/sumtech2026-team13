from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.domains.element_location.router import router as element_location_router

API_PREFIX = "/api/v1"

app = FastAPI(title="sumtech 2026 Team 13 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(element_location_router, prefix=API_PREFIX)
