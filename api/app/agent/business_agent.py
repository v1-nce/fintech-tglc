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
        credential_service: CredentialService
    ):
        self.risk_model = risk_model
        self.liquidity_engine = liquidity_engine
        self.credential_service = credential_service

    def act(self, business_id: str, unlock_time: datetime) -> LiquidityRequest:
        """
        Main orchestration:
        1. Pull credentials
        2. Evaluate risk
        3. Produce liquidity request with unlock_time
        """
        # Step 1: pull credentials
        credentials = self.credential_service.get_credentials(business_id)
        
        # Step 2: evaluate risk metrics
        metrics = self.risk_model.evaluate(credentials)
        
        # Step 3: determine liquidity amount
        liquidity_amount = self.liquidity_engine.calculate_liquidity(metrics)
        
        # Step 4: construct LiquidityRequest
        request = LiquidityRequest(
            business_id=business_id,
            requested_amount=liquidity_amount,
            metrics=metrics,
            unlock_time=unlock_time
        )
        
        return request
