# routes/credentials.py
from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator
from ..services.credential_service import CredentialService
from ..services.credit_service import CreditService
from ..utils.validators import validate_xrpl_address
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Credentials"])

# -------------------
# Utilities
# -------------------
def validate_xrpl_address(address: str) -> str:
    if not re.match(r'^r[1-9A-HJ-NP-Za-km-z]{25,34}$', address):
        raise ValueError("Invalid XRPL address format")
    return address

# -------------------
# Pydantic Models
# -------------------
class IssueRequest(BaseModel):
    principal_address: str = Field(..., min_length=25, max_length=35)
    amount: str = Field(default="1000000", pattern=r'^\d+(\.\d+)?$')  # XRPL decimal format
    currency: str = Field(
        default="CORRIDOR_ELIGIBLE",
        min_length=3,
        max_length=40,
        pattern=r'^[A-Z0-9_]+$'
    )
    
    @field_validator('principal_address')
    @classmethod
    def validate_address(cls, v: str) -> str:
        return validate_xrpl_address(v)

# -------------------
# Endpoints
# -------------------
@router.post("/issue")
async def issue_credential(req: IssueRequest):
    """
    Issue a new credit credential (trust line) to a principal.
    """
    try:
        service = CredentialService()
        
        # Submit the XRPL TrustSet in a threadpool for async safety
        result = await run_in_threadpool(
            service.submit_trust_set,
            req.principal_address,
            req.amount,
            req.currency
        )

        return {
            "status": result.get("status", "prepared"),
            "transaction": result.get("transaction"),
            "issuer": result.get("issuer"),
            "message": result.get("message", "Transaction prepared successfully. Principal must sign and submit this transaction."),
            "original_currency": result.get("original_currency")
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Credential issuance failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score/{address}")
async def get_credit_score(address: str):
    """
    Get credit score for an XRPL address.
    """
    try:
        validate_xrpl_address(address)
        credit_svc = CreditService()
        credit = await run_in_threadpool(credit_svc.get_credit_score, address)
        return credit
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Credit score fetch failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch credit score")
