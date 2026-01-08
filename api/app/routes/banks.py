from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
import logging

from ..services.bank_service import BankService
from ..utils.validators import validate_xrpl_address

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Banks"])

class BankRegistration(BaseModel):
    bank_name: str = Field(..., min_length=1, max_length=100)
    wallet_address: str = Field(..., min_length=25, max_length=35)
    max_per_loan: float = Field(..., gt=0, le=1_000_000_000)
    min_credit_score: int = Field(default=500, ge=300, le=850)

@router.post("/register")
async def register_bank(req: BankRegistration):
    """Register a bank on the platform."""
    try:
        validate_xrpl_address(req.wallet_address)
        service = BankService()
        bank = await run_in_threadpool(
            service.register_bank,
            req.bank_name,
            req.wallet_address,
            req.max_per_loan,
            req.min_credit_score
        )
        return {"status": "registered", "bank": bank}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Bank registration failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

