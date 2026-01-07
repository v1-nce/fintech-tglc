from xrpl.wallet import generate_faucet_wallet
from xrpl.clients import JsonRpcClient
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    print("Initializing XRPL Ledger Setup...")
    
    client = JsonRpcClient("https://s.altnet.rippletest.net:51234/")
    
    issuer_seed = os.getenv("ISSUER_SEED")
    if issuer_seed:
        from xrpl.wallet import Wallet
        issuer_wallet = Wallet.from_seed(issuer_seed)
        print(f"Using existing issuer wallet: {issuer_wallet.classic_address}")
    else:
        print("Generating new issuer wallet...")
        issuer_wallet = generate_faucet_wallet(client, debug=True)
        print(f"\nIMPORTANT: Save this SEED in api/.env:")
        print(f"ISSUER_SEED={issuer_wallet.seed}")
    
    print(f"\nIssuer Address: {issuer_wallet.classic_address}")
    print(f"Network: Testnet")
    print(f"\nLedger initialization complete!")

if __name__ == "__main__":
    main()
