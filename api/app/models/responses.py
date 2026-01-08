from pydantic import BaseModel

class CreditDecision(BaseModel):
    approved: bool
    approved_amount: float | None = None
    rate: str | None = None
    reason: str | None = None