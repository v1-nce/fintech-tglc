from .base import BaseAgent
from ..services.liquidity_engine import LiquidityEngine
from ..services.risk_model import RiskModel
from ..services.credential_service import CredentialService
from ..models.requests import LiquidityRequest
from datetime import datetime, timezone

class BusinessAgent(BaseAgent):
    def __init__(
        self, 
        risk_model: RiskModel, 
        liquidity_engine: LiquidityEngine, 
        credential_service: CredentialService,
        bank_service: BankService
    ):
        self.risk_model = risk_model
        self.liquidity_engine = liquidity_engine
        self.credential_service = credential_service
        self.bank_service = bank_service

    def act(self, business_id: str, unlock_time: datetime):
        # Pull credentials
        credentials = self.credential_service.get_credentials(business_id)
        
        # Evaluate risk metrics
        metrics = self.risk_model.evaluate(credentials)
        
        # Determine liquidity amount
        liquidity_amount = self.liquidity_engine.calculate_liquidity(metrics)
        
        # Determine credit score for bank matching
        credit_score = metrics.get("credit_score", 600)  # fallback
        
        # Find matching banks
        matching_banks = self.bank_service.find_matching_banks(liquidity_amount, credit_score)
        
        # Construct liquidity request
        request = LiquidityRequest(
            business_id=business_id,
            requested_amount=liquidity_amount,
            metrics=metrics,
            unlock_time=unlock_time,
            eligible_banks=matching_banks  # <- new field
        )
        
        return request
