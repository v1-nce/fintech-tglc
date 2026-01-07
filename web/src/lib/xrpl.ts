import { Client, Wallet, Payment, TrustSet, xrpToDrops } from 'xrpl';

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';
const MAINNET_URL = 'wss://xrplcluster.com/';

export function getClient(): Client {
  const network = process.env.NEXT_PUBLIC_XRPL_NETWORK || 'testnet';
  return new Client(network === 'mainnet' ? MAINNET_URL : TESTNET_URL);
}

export async function createWallet(client: Client) {
  const { wallet, balance } = await client.fundWallet();
  return { wallet, balance };
}

export async function sendPayment(
  client: Client,
  wallet: Wallet,
  destination: string,
  amount: number
) {
  const tx: Payment = {
    TransactionType: 'Payment',
    Account: wallet.classicAddress,
    Destination: destination,
    Amount: xrpToDrops(amount),
  };
  return await client.submitAndWait(tx, { autofill: true, wallet });
}

export async function createTrustSet(
  client: Client,
  wallet: Wallet,
  issuer: string,
  currency: string,
  limit: string
) {
  const tx: TrustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.classicAddress,
    LimitAmount: {
      currency,
      issuer,
      value: limit,
    },
  };
  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  return await client.submitAndWait(signed.tx_blob);
}
