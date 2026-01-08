import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';
import { Loan } from '@/app/loan-details/components/loan';



interface Payment {
    loanID : number;
    paymentAmount : number;
    interestAmount : number;
    principalAmount : number;
    agentAddress : string; 
}

interface TxData {
  hash: string;
  type: string;
  amount: string;         
  destination?: string;     
  date?: number;            
  memos: Array<any>;        // can refine later if we know memo structure
}



class XRPLService {
    client : any;
    wallet : any;
    network : string;
    rpcUrl : string;

    
  constructor() {
    this.client = null;
    this.wallet = null;
    this.network = 'testnet';
    this.rpcUrl =  'wss://s.altnet.rippletest.net:51233';
  }

  async connect() {
    if (this.client?.isConnected()) {
      return this.client;
    }

    try {
      this.client = new Client(this.rpcUrl);
      await this.client?.connect();
      console.log('Connected to XRPL network:', this.network);
      return this.client;
    } catch (error) {
      console.error('Failed to connect to XRPL:', error);
      throw new Error('Failed to connect to XRP Ledger network');
    }
  }

  async disconnect() {
    if (this.client?.isConnected()) {
      await this.client?.disconnect();
      console.log('Disconnected from XRPL network');
    }
  }

  async createWallet() {
    try {
      await this.connect();
      const fundResult = await this.client?.fundWallet();
      this.wallet = fundResult?.wallet;
      
      return {
        address: this.wallet?.address,
        balance: fundResult?.balance,
        seed: this.wallet?.seed
      };
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Failed to create XRPL wallet');
    }
  }

  async connectWallet(seed : string) {
    try {
      await this.connect();
      this.wallet = Wallet?.fromSeed(seed);
      const balance = await this.getBalance(this.wallet?.address);
      
      return {
        address: this.wallet?.address,
        balance: balance
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new Error('Failed to connect XRPL wallet');
    }
  }

  async getBalance(address : string) {
    try {
      await this.connect();
      const response = await this.client?.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });
      
      return dropsToXrp(response?.result?.account_data?.Balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async createLoanOffer(loanData : Loan) {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.connect();

      const loanMetadata = {
        loanAmount: loanData?.loanAmount,
        interestRate: loanData?.interestRate,
        loanTerm: loanData?.loanTerm,
        minCreditScore: loanData?.minCreditScore,
        collateralRequired: loanData?.collateralRequired,
        collateralPercentage: loanData?.collateralPercentage,
        timestamp: new Date()?.toISOString(),
        type: 'LOAN_OFFER'
      };

      const memoData = JSON.stringify(loanMetadata);
      const memoHex = Buffer.from(memoData, 'utf8')?.toString('hex')?.toUpperCase();

      const prepared = await this.client?.autofill({
        TransactionType: 'Payment',
        Account: this.wallet?.address,
        Destination: this.wallet?.address,
        Amount: '1',
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('LOAN_OFFER', 'utf8')?.toString('hex')?.toUpperCase(),
              MemoData: memoHex
            }
          }
        ]
      });

      const signed = this.wallet?.sign(prepared);
      const result = await this.client?.submitAndWait(signed?.tx_blob);

      if (result?.result?.meta?.TransactionResult === 'tesSUCCESS') {
        return {
          success: true,
          transactionHash: result?.result?.hash,
          ledgerIndex: result?.result?.ledger_index,
          fee: dropsToXrp(prepared?.Fee),
          loanId: `LOAN-${Date.now()}`,
          contractAddress: this.wallet?.address,
          network: this.network
        };
      } else {
        throw new Error('Transaction failed: ' + result.result.meta.TransactionResult);
      }
    } catch (error ) {
      console.error('Failed to create loan offer:', error);
      throw new Error('Failed to create loan offer on XRPL: ' + (error as Error).message);
    }
  }



  async processPayment(paymentData : Payment) {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      await this.connect();

      const paymentMetadata = {
        loanId: paymentData?.loanID,
        paymentAmount: paymentData?.paymentAmount,
        interestAmount: paymentData?.interestAmount,
        principalAmount: paymentData?.principalAmount,
        timestamp: new Date()?.toISOString(),
        type: 'LOAN_PAYMENT'
      };

      const memoData = JSON.stringify(paymentMetadata);
      const memoHex = Buffer.from(memoData, 'utf8')?.toString('hex')?.toUpperCase();

      const amountInDrops = xrpToDrops(paymentData?.paymentAmount?.toString());

      const prepared = await this.client?.autofill({
        TransactionType: 'Payment',
        Account: this.wallet?.address,
        Destination: paymentData?.agentAddress,
        Amount: amountInDrops,
        Memos: [
          {
            Memo: {
              MemoType: Buffer.from('LOAN_PAYMENT', 'utf8')?.toString('hex')?.toUpperCase(),
              MemoData: memoHex
            }
          }
        ]
      });

      const signed = this.wallet?.sign(prepared);
      const result = await this.client?.submitAndWait(signed?.tx_blob);

      if (result?.result?.meta?.TransactionResult === 'tesSUCCESS') {
        return {
          success: true,
          transactionHash: result?.result?.hash,
          ledgerIndex: result?.result?.ledger_index,
          fee: dropsToXrp(prepared?.Fee),
          amount: dropsToXrp(amountInDrops),
          timestamp: new Date()?.toISOString(),
          network: this.network
        };
      } else {
        throw new Error('Transaction failed: ' + result.result.meta.TransactionResult);
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw new Error('Failed to process payment on XRPL: ' + (error as Error).message);
    }
  }

  async getTransactionHistory(address : string, limit = 10) {
    try {
      await this.connect();
      const response = await this.client?.request({
        command: 'account_tx',
        account: address,
        limit: limit,
        ledger_index_min: -1,
        ledger_index_max: -1
      });

      return response?.result?.transactions?.map((tx : TxData)  => ({
        hash: tx?.hash,
        type: tx?.type,
        amount: tx?.amount ? dropsToXrp(tx?.amount) : '0',
        destination: tx?.destination,
        date: tx?.date,
        memos: tx?.memos || []
      }));
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }
}

export default new XRPLService();