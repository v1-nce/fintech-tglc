# api/app/services/escrow_service.py

import logging
from datetime import datetime, timedelta
from xrpl.wallet import Wallet
from xrpl.models.transactions import EscrowCreate, EscrowFinish
from xrpl.utils import xrp_to_drops
from .xrpl_client import XRPLClient
from ..utils.validators import validate_xrpl_address, validate_xrp_amount, validate_fulfillment

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class EscrowService:
    def __init__(self):
        self.xrpl_client = XRPLClient()

    # -----------------------------
    # Create & submit escrow
    # -----------------------------
    def submit_escrow_create(
        self,
        from_wallet: Wallet,
        to_address: str,
        amount_xrp: float,
        finish_after_seconds: int = 3600  # default 1 hour
    ) -> dict:
        validate_xrpl_address(from_wallet.classic_address)
        validate_xrpl_address(to_address)
        validate_xrp_amount(amount_xrp)

        # Compute finish_after in XRPL ledger time (seconds since 2000-01-01)
        finish_after = int((datetime.utcnow() - datetime(2000, 1, 1)).total_seconds()) + finish_after_seconds

        tx = EscrowCreate(
            account=from_wallet.classic_address,
            destination=to_address,
            amount=xrp_to_drops(amount_xrp),
            finish_after=finish_after
        )

        logger.info(f"Submitting EscrowCreate: {amount_xrp} XRP from {from_wallet.classic_address} to {to_address}")
        result = self.xrpl_client.submit(tx, from_wallet)
        logger.info(f"EscrowCreate submitted successfully, tx_hash={result.get('hash')}")
        return result

    # -----------------------------
    # Finish escrow
    # -----------------------------
    def submit_escrow_finish(
        self,
        owner_wallet: Wallet,
        escrow_sequence: int,
        fulfillment: str | None = None
    ) -> dict:
        validate_fulfillment(fulfillment)

        tx = EscrowFinish(
            account=owner_wallet.classic_address,
            owner=owner_wallet.classic_address,
            offer_sequence=escrow_sequence,
            fulfillment=fulfillment
        )

        logger.info(f"Submitting EscrowFinish for offer_sequence={escrow_sequence}")
        result = self.xrpl_client.submit(tx, owner_wallet)
        logger.info(f"EscrowFinish submitted successfully, tx_hash={result.get('hash')}")
        return result
