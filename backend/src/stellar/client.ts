import { Horizon, Networks, Asset, Keypair, TransactionBuilder, Operation, Memo, BASE_FEE } from '@stellar/stellar-sdk';
import { config } from '../config';

export class StellarClient {
  private server: Horizon.Server;

  constructor() {
    this.server = new Horizon.Server(config.stellarHorizonUrl, { allowHttp: false });
  }

  getServer(): Horizon.Server {
    return this.server;
  }

  getNetwork(): string {
    return config.stellarNetwork === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
  }

  async getAccount(publicKey: string): Promise<Horizon.AccountResponse> {
    return this.server.loadAccount(publicKey);
  }

  async getBalance(publicKey: string): Promise<{ XLM: string; USDC: string }> {
    const account = await this.server.loadAccount(publicKey);
    let xlm = '0';
    let usdc = '0';
    for (const balance of account.balances) {
      if (balance.asset_type === 'native') {
        xlm = balance.balance;
      } else if (
        balance.asset_type === 'credit_alphanum4' &&
        'asset_code' in balance &&
        balance.asset_code === 'USDC' &&
        'asset_issuer' in balance &&
        balance.asset_issuer === config.stellarUsdcIssuer
      ) {
        usdc = balance.balance;
      }
    }
    return { XLM: xlm, USDC: usdc };
  }

  getUSDCAsset(): Asset {
    return new Asset('USDC', config.stellarUsdcIssuer);
  }

  getNativeAsset(): Asset {
    return Asset.native();
  }

  async fetchBaseFee(): Promise<string> {
    try {
      const feeStats = await this.server.feeStats();
      return feeStats.fee_charged.mode || BASE_FEE;
    } catch {
      return BASE_FEE;
    }
  }
}

export const stellarClient = new StellarClient();
