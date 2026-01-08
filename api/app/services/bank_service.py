from typing import Dict, List, Optional
import logging
from .xrpl_client import XRPLClient
from ..utils.validators import validate_xrpl_address

logger = logging.getLogger(__name__)

_banks: Dict[str, Dict] = {}

class BankService:
    def __init__(self):
        self.xrpl = XRPLClient()
    
    def register_bank(self, bank_name: str, wallet_address: str, max_per_loan: float, min_credit_score: int = 500) -> Dict:
        validate_xrpl_address(wallet_address)
        account_info = self.xrpl.get_account_info(wallet_address)
        balance_drops = int(account_info.get("account_data", {}).get("Balance", 0))
        balance_xrp = float(balance_drops) / 1_000_000
        
        bank_data = {
            "bank_name": bank_name,
            "wallet_address": wallet_address,
            "max_per_loan": max_per_loan,
            "min_credit_score": min_credit_score,
            "balance_xrp": balance_xrp
        }
        
        _banks[wallet_address] = bank_data
        logger.info(f"Bank registered: {bank_name} ({wallet_address})")
        return bank_data
    
    def find_matching_banks(self, amount_xrp: float, credit_score: int) -> List[Dict]:
        matches = []
        for bank in _banks.values():
            if (bank["max_per_loan"] >= amount_xrp and 
                bank["min_credit_score"] <= credit_score and
                bank["balance_xrp"] >= amount_xrp):
                matches.append(bank)
        return sorted(matches, key=lambda x: x["min_credit_score"])

