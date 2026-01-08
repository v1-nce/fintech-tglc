from pydantic import BaseModel
from typing import Dict

class LiquidityRequest(BaseModel):
    business_id: str
    requested_amount: float
    duration_days: int
    metrics: Dict[str, float]