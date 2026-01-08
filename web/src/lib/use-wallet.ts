import { create } from 'zustand';
import type { WalletManager as WalletManagerType } from 'xrpl-connect';

let walletManager: WalletManagerType | null = null;
let initPromise: Promise<void> | null = null;

const initializeWalletManager = async (): Promise<void> => {
  if (walletManager || typeof window === 'undefined') return;

  const { WalletManager, CrossmarkAdapter, XamanAdapter, WalletConnectAdapter } = await import('xrpl-connect');

  const networkName = (process.env.NEXT_PUBLIC_XRPL_NETWORK_NAME || 'testnet').toLowerCase();
  const targetNetwork = ['testnet', 'mainnet', 'devnet'].includes(networkName)
    ? (networkName as 'testnet' | 'mainnet' | 'devnet')
    : 'testnet';

  const adapters: any[] = [new CrossmarkAdapter()];
  if (process.env.NEXT_PUBLIC_XAMAN_API_KEY) {
    adapters.push(new XamanAdapter(process.env.NEXT_PUBLIC_XAMAN_API_KEY));
  }
  if (process.env.NEXT_PUBLIC_WC_PROJECT_ID) {
    adapters.push(new WalletConnectAdapter({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID }));
  }

  walletManager = new WalletManager({ network: targetNetwork, adapters });
  walletManager.on('accountChanged', (addr: string) => useWallet.setState({ address: addr, isConnected: !!addr }));
  walletManager.on('disconnect', () => useWallet.setState({ address: null, isConnected: false }));
};

if (typeof window !== 'undefined') {
  initPromise = initializeWalletManager();
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  connect: (id: string) => Promise<void>;
  disconnect: () => void;
  signAndSubmit: (tx: any) => Promise<any>;
}

export const useWallet = create<WalletState>((set, get) => ({
  isConnected: false,
  address: null,

  connect: async (id: string) => {
    if (initPromise) await initPromise;
    if (!walletManager) throw new Error('Wallet manager not initialized');

    const result = await walletManager.connect(id);
    const address = typeof result === 'string' ? result : result?.address;
    if (!address) throw new Error('Connection failed: No address returned');
    set({ isConnected: true, address });
  },

  disconnect: () => {
    walletManager?.disconnect();
    set({ isConnected: false, address: null });
  },

  signAndSubmit: async (tx: any) => {
    if (initPromise) await initPromise;
    if (!walletManager || !get().isConnected) throw new Error('Wallet not connected');
    return walletManager.signAndSubmit(tx);
  },
}));
