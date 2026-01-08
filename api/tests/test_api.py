import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, MagicMock
import sys, os
from datetime import datetime
# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app

# -------------------
# Test liquidity endpoints
# -------------------
@pytest.mark.asyncio
async def test_request_liquidity():
    transport = ASGITransport(app=app)

    # Mock ProofVerifier.verify
    with patch("app.routes.liquidity.ProofVerifier") as MockVerifier:
        verifier_instance = MockVerifier.return_value
        verifier_instance.verify.return_value = {"score": 95, "default_rate": 0.01}

        # Mock BusinessAgent.prepare_request
        with patch("app.routes.liquidity.BusinessAgent") as MockBusiness:
            business_instance = MockBusiness.return_value
            business_instance.prepare_request.return_value = {
                "business_id": "did:example:1234567890",
                "principal_address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
                "requested_amount": 5000.0,
                "metrics": {"score": 95, "default_rate": 0.01},
                "duration_days": 30
            }

            # Mock BankAgent.evaluate
            with patch("app.routes.liquidity.BankAgent") as MockBank:
                bank_instance = MockBank.return_value
                decision_mock = MagicMock()
                decision_mock.status = "approved"
                decision_mock.dict.return_value = {"status": "approved"}
                bank_instance.evaluate.return_value = decision_mock

                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    payload = {
                        "principal_did": "did:example:1234567890",
                        "principal_address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
                        "amount_xrp": 5000.0,
                        "proof_data": {
                            "metrics": {"score": 95, "default_rate": 0.01},
                            "timestamp": datetime.now().isoformat(),
                            "source": "internal",
                            "signature": None
                        }
                    }
                    response = await client.post("/liquidity/request", json=payload)
                    assert response.status_code == 200
                    data = response.json()
                    assert data["status"] == "approved"
                    assert "decision" in data


@pytest.mark.asyncio
async def test_verify_proof():
    transport = ASGITransport(app=app)

    # Mock ProofVerifier.verify
    with patch("app.routes.liquidity.ProofVerifier") as MockVerifier:
        verifier_instance = MockVerifier.return_value
        verifier_instance.verify.return_value = {"score": 95, "default_rate": 0.01}

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "metrics": {"score": 95, "default_rate": 0.01},
                "timestamp": datetime.now().isoformat(),
                "source": "internal",
                "signature": None
            }
            response = await client.post("/liquidity/verify-proof", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert "result" in data


# -------------------
# Test credentials endpoint
# -------------------

@pytest.mark.asyncio
async def test_issue_credential():
    # Create a fresh FastAPI app for testing
    transport = ASGITransport(app=app)

    # Patch CredentialService inside the route
    with patch("app.routes.credentials.CredentialService") as MockService:
        service_instance = MockService.return_value
        service_instance.submit_trust_set.return_value = {
            "transaction": "tx_123",
            "issuer": "bank_001"
        }

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "principal_address": "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
                "amount": "1000000",
                "currency": "CORRIDOR_ELIGIBLE"
            }
            response = await client.post("/credentials/issue", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "submitted"
            assert "transaction" in data
            assert "issuer" in data