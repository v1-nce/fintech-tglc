# routes/router.py
from fastapi import APIRouter
from .liquidity import router as liquidity_router
from .credentials import router as credentials_router

# Create the main API router
router = APIRouter()

# Include sub-routers
router.include_router(liquidity_router, prefix="", tags=["Liquidity"])
router.include_router(credentials_router, prefix="", tags=["Credentials"])
