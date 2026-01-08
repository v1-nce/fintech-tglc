from typing import Dict, Optional
import logging
from datetime import datetime, timezone
from .xrpl_client import XRPLClient
from .risk_model import RiskModel
from ..utils.validators import validate_xrpl_address

logger = logging.getLogger(__name__)


class CreditService:
    def __init__(self):
        self.xrpl = XRPLClient()
        self.risk_model = RiskModel()
        self.issuer_address = self.xrpl.address

    def get_credit_score(self, address: str) -> Dict:
        """
        Calculate credit score from on-chain XRPL data (fully decentralized).
        No trust line required - reputation is built from transaction history.
        
        Returns:
            {
                "score": int (300-850),
                "rating": str,
                "max_eligible": float,
                "factors": dict
            }
        """
        validate_xrpl_address(address)
        
        lines = self.xrpl.get_account_lines(address)
        txs = self.xrpl.get_account_transactions(address, limit=50)
        
        successful_payments = self._count_successful_payments(txs)
        trust_lines_count = len(lines)
        
        score = 500
        score += min(100, trust_lines_count * 25)
        score += min(200, successful_payments * 15)
        score = max(300, min(850, score))
        
        rating = self._get_rating(score)
        max_eligible = self._calculate_max_eligible(score, 0.0)
        
        credentials_data = {
            "cashflow": {
                "expected_inflows": [],
                "expected_outflows": []
            }
        }
        
        metrics = self.risk_model.evaluate(credentials_data)
        
        return {
            "score": score,
            "rating": rating,
            "max_eligible": max_eligible,
            "factors": {
                "trust_lines": trust_lines_count,
                "successful_payments": successful_payments,
                "default_rate": metrics.get("default_rate", 0.004),
                "volatility": metrics.get("volatility", 0.12)
            }
        }

    def check_eligibility(self, address: str, amount: float) -> Dict:
        """
        Check if borrower can request this amount based on on-chain credit score.
        Fully automated - no trust line required.
        
        Returns:
            {
                "eligible": bool,
                "credit": dict,
                "reason": str | None
            }
        """
        credit = self.get_credit_score(address)
        
        if amount > credit["max_eligible"]:
            return {
                "eligible": False,
                "credit": credit,
                "reason": f"Requested amount ({amount} XRP) exceeds maximum eligible ({credit['max_eligible']} XRP) based on credit score ({credit['score']})."
            }
        
        if credit["score"] < 300:
            return {
                "eligible": False,
                "credit": credit,
                "reason": f"Insufficient credit score ({credit['score']}). Minimum required: 300."
            }
        
        return {
            "eligible": True,
            "credit": credit,
            "reason": None
        }


    def _count_successful_payments(self, transactions: list) -> int:
        """Count successful Payment transactions."""
        count = 0
        for tx in transactions:
            tx_data = tx.get("tx", {}) if isinstance(tx, dict) else {}
            if tx_data.get("TransactionType") == "Payment":
                meta = tx.get("meta", {})
                result = meta.get("TransactionResult")
                if result == "tesSUCCESS":
                    count += 1
        return count

    def _get_rating(self, score: int) -> str:
        """Convert score to rating."""
        if score >= 750:
            return "Excellent"
        elif score >= 650:
            return "Good"
        elif score >= 500:
            return "Fair"
        else:
            return "Poor"

    def _calculate_max_eligible(self, score: int, _unused: float = 0.0) -> float:
        """Calculate max eligible amount based on credit score only."""
        if score >= 750:
            return 10000.0
        elif score >= 650:
            return 5000.0
        elif score >= 500:
            return 2000.0
        else:
            return 500.0

