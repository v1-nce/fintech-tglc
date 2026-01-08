# Testing Bank Loans - Step by Step Guide

## The Problem
Currently, escrows lock funds for 30 days. For real loans, borrowers need **immediate access** to funds, with repayment due in 30 days.

## Solution: Two Approaches

### Approach 1: Immediate Release (Recommended for Testing)
Set `finish_after` to current time so borrower can claim funds immediately after bank creates escrow.

### Approach 2: Auto-Finish After Creation
After bank creates escrow, automatically finish it to transfer funds to borrower.

---

## Step-by-Step Testing Guide

### Step 1: Create a Test Bank Wallet

```bash
# Option A: Use XRPL Testnet Faucet
# Visit: https://xrpl.org/xrp-testnet-faucet.html
# Generate a new wallet and fund it with test XRP

# Option B: Use xrpl-py to generate
python -c "
from xrpl.wallet import generate_faucet_wallet
from xrpl.clients import JsonRpcClient
client = JsonRpcClient('https://s.altnet.rippletest.net:51234')
wallet = generate_faucet_wallet(client)
print(f'Bank Wallet Address: {wallet.classic_address}')
print(f'Bank Wallet Seed: {wallet.seed}')
"
```

**Save these values!** You'll need:
- Bank wallet address (e.g., `rBank...`)
- Bank wallet seed (for signing transactions)

---

### Step 2: Register the Bank

```bash
POST http://localhost:8000/api/banks/register
Content-Type: application/json

{
  "bank_name": "Test Bank",
  "wallet_address": "rBank...",  # From Step 1
  "max_per_loan": 10000,
  "min_credit_score": 400
}
```

**Expected Response:**
```json
{
  "status": "registered",
  "bank": {
    "bank_name": "Test Bank",
    "wallet_address": "rBank...",
    "max_per_loan": 10000,
    "min_credit_score": 400,
    "balance_xrp": 1000.0
  }
}
```

---

### Step 3: Request Liquidity (as Borrower)

```bash
POST http://localhost:8000/api/liquidity/request
Content-Type: application/json

{
  "principal_address": "rKJq9PiCvAnxrzhGJay79HXp9MrKjyu5qR",  # Your borrower wallet
  "amount_xrp": 10
}
```

**Expected Response (with bank matched):**
```json
{
  "status": "matched",
  "transaction": {
    "TransactionType": "EscrowCreate",
    "Account": "rBank...",
    "Destination": "rKJq9PiCvAnxrzhGJay79HXp9MrKjyu5qR",
    "Amount": "10000000",  # 10 XRP in drops
    "FinishAfter": 1735689600  # Unix timestamp (30 days from now)
  },
  "matched_bank": {
    "name": "Test Bank",
    "wallet": "rBank..."
  },
  "message": "Matched with Test Bank. Escrow transaction prepared for bank signing."
}
```

---

### Step 4: Bank Signs Escrow Transaction

The bank needs to sign the `EscrowCreate` transaction. For testing:

**Option A: Use xrpl-py (Backend)**
```python
from xrpl.wallet import Wallet
from xrpl.transaction import submit_and_wait
from xrpl.models.transactions import EscrowCreate
from xrpl.utils import xrp_to_drops

bank_wallet = Wallet.from_seed("sYourBankSeed...")
escrow_tx = EscrowCreate(
    account=bank_wallet.classic_address,
    destination="rKJq9PiCvAnxrzhGJay79HXp9MrKjyu5qR",
    amount=xrp_to_drops(10),
    finish_after=1735689600  # Or use current time for immediate access
)

response = submit_and_wait(escrow_tx, client, bank_wallet)
print(f"Escrow created: {response.result['hash']}")
print(f"Sequence: {response.result['Sequence']}")
```

**Option B: Use Crossmark/Xaman (Frontend)**
- The frontend should display the transaction
- Bank connects wallet and signs via Crossmark/Xaman
- Transaction submitted to XRPL

---

### Step 5: Borrower Claims Funds IMMEDIATELY

For immediate loan access, you have two options:

#### Option A: Set `finish_after` to Current Time

Modify the request to set unlock time to now:

```bash
POST http://localhost:8000/api/liquidity/request
Content-Type: application/json

{
  "principal_address": "rKJq9PiCvAnxrzhGJay79HXp9MrKjyu5qR",
  "amount_xrp": 10,
  "unlock_time": "2025-01-15T00:00:00Z"  # Set to current time or past
}
```

#### Option B: Finish Escrow Immediately After Creation

After bank creates escrow, borrower immediately finishes it:

```bash
POST http://localhost:8000/api/liquidity/finish-escrow
Content-Type: application/json

{
  "borrower_wallet": "rKJq9PiCvAnxrzhGJay79HXp9MrKjyu5qR",
  "escrow_sequence": 12345,  # From Step 4 response
  "owner_wallet": "rBank..."  # Bank's wallet address
}
```

**Expected Response:**
```json
{
  "status": "ready_to_sign",
  "message": "EscrowFinish prepared. Sign with your wallet to receive funds.",
  "transaction": {
    "TransactionType": "EscrowFinish",
    "Account": "rKJq9PiCvAnxrzhGJay79HXp9MrKjyu5qR",
    "Owner": "rBank...",
    "OfferSequence": 12345
  }
}
```

Borrower signs this transaction → **10 XRP transfers to borrower wallet immediately!**

---

## How the Project Should Enforce This

### Current Issue
- `finish_after` = 30 days means borrower waits 30 days
- This is the **repayment deadline**, not when funds are available

### Fix Options

**Option 1: Immediate Access (Recommended)**
```python
# In liquidity.py, set finish_after to current time for immediate loans
unlock_timestamp = int(datetime.now(timezone.utc).timestamp())
```

**Option 2: Separate Loan Terms**
- `finish_after` = current time (when funds available)
- `repayment_deadline` = 30 days (when loan due)
- Use escrow condition or separate tracking for repayment

**Option 3: Auto-Finish Flow**
```python
# After bank creates escrow, automatically finish it
if response.status == "matched":
    # Bank creates escrow
    # Then immediately finish it to transfer funds
    finish_response = finish_escrow(...)
```

---

## Complete Test Flow

1. ✅ Register bank with testnet wallet
2. ✅ Request liquidity as borrower
3. ✅ System matches with bank
4. ✅ Bank signs EscrowCreate transaction
5. ✅ **IMMEDIATELY**: Borrower finishes escrow to get funds
6. ✅ Funds in borrower wallet NOW
7. ✅ Repayment due in 30 days (tracked separately or via escrow condition)

---

## Quick Test Script

```python
# test_bank_loan.py
from xrpl.wallet import generate_faucet_wallet
from xrpl.clients import JsonRpcClient
from xrpl.transaction import submit_and_wait
from xrpl.models.transactions import EscrowCreate, EscrowFinish
from xrpl.utils import xrp_to_drops
import requests
import time

# 1. Create bank wallet
client = JsonRpcClient('https://s.altnet.rippletest.net:51234')
bank_wallet = generate_faucet_wallet(client)
print(f"Bank: {bank_wallet.classic_address}")

# 2. Register bank
requests.post('http://localhost:8000/api/banks/register', json={
    "bank_name": "Test Bank",
    "wallet_address": bank_wallet.classic_address,
    "max_per_loan": 10000,
    "min_credit_score": 400
})

# 3. Create borrower wallet
borrower_wallet = generate_faucet_wallet(client)
print(f"Borrower: {borrower_wallet.classic_address}")

# 4. Request liquidity
response = requests.post('http://localhost:8000/api/liquidity/request', json={
    "principal_address": borrower_wallet.classic_address,
    "amount_xrp": 10,
    "unlock_time": datetime.now(timezone.utc).isoformat()  # Immediate
})

# 5. Bank signs escrow (if matched)
if response.json()['status'] == 'matched':
    tx_dict = response.json()['transaction']
    escrow_tx = EscrowCreate.from_dict(tx_dict)
    escrow_response = submit_and_wait(escrow_tx, client, bank_wallet)
    escrow_seq = escrow_response.result['Sequence']
    
    # 6. Borrower immediately finishes escrow
    finish_tx = EscrowFinish(
        account=borrower_wallet.classic_address,
        owner=bank_wallet.classic_address,
        offer_sequence=escrow_seq
    )
    finish_response = submit_and_wait(finish_tx, client, borrower_wallet)
    print(f"✅ Funds transferred! Hash: {finish_response.result['hash']}")
```

