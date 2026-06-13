import {
  Keypair,
  Transaction,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Networks,
} from '@stellar/stellar-sdk';
import { stellarClient } from './client';

export interface PayoutRecipient {
  walletAddress: string;
  amount: string;
  currency: 'XLM' | 'USDC';
  employeeId: string;
  payrollItemId: string;
}

export interface PayoutResult {
  payrollItemId: string;
  success: boolean;
  txHash?: string;
  ledger?: number;
  error?: string;
}

const MAX_OPS_PER_TX = 100;

export class BulkPayoutEngine {
  async executeBulkPayout(
    sourceSecretKey: string,
    recipients: PayoutRecipient[],
    payrollId: string,
    memo?: string
  ): Promise<PayoutResult[]> {
    const sourceKeypair = Keypair.fromSecret(sourceSecretKey);
    const results: PayoutResult[] = [];

    // Batch into groups of MAX_OPS_PER_TX
    const batches: PayoutRecipient[][] = [];
    for (let i = 0; i < recipients.length; i += MAX_OPS_PER_TX) {
      batches.push(recipients.slice(i, i + MAX_OPS_PER_TX));
    }

    for (const batch of batches) {
      const batchResults = await this.executeBatch(sourceKeypair, batch, payrollId, memo);
      results.push(...batchResults);
    }

    return results;
  }

  private async executeBatch(
    sourceKeypair: Keypair,
    recipients: PayoutRecipient[],
    payrollId: string,
    memo?: string
  ): Promise<PayoutResult[]> {
    const server = stellarClient.getServer();
    const network = stellarClient.getNetwork();

    try {
      const sourceAccount = await stellarClient.getAccount(sourceKeypair.publicKey());
      const fee = await stellarClient.fetchBaseFee();

      const memoText = (memo || payrollId).substring(0, 28);
      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee,
        networkPassphrase: network,
      })
        .addMemo(Memo.text(memoText))
        .setTimeout(180);

      for (const recipient of recipients) {
        const asset =
          recipient.currency === 'USDC'
            ? stellarClient.getUSDCAsset()
            : stellarClient.getNativeAsset();

        txBuilder.addOperation(
          Operation.payment({
            destination: recipient.walletAddress,
            asset,
            amount: recipient.amount,
          })
        );
      }

      const tx = txBuilder.build();
      tx.sign(sourceKeypair);

      const response = await server.submitTransaction(tx);
      const txHash = response.hash;
      const ledger = (response as any).ledger as number;

      return recipients.map((r) => ({
        payrollItemId: r.payrollItemId,
        success: true,
        txHash,
        ledger,
      }));
    } catch (batchError: any) {
      // Batch failed — retry each payment individually
      console.warn(`Batch failed, retrying individually: ${batchError.message}`);
      return this.retryIndividually(sourceKeypair, recipients, payrollId, network);
    }
  }

  private async retryIndividually(
    sourceKeypair: Keypair,
    recipients: PayoutRecipient[],
    payrollId: string,
    network: string
  ): Promise<PayoutResult[]> {
    const server = stellarClient.getServer();
    const results: PayoutResult[] = [];

    for (const recipient of recipients) {
      try {
        // Re-fetch account each time (sequence number advances)
        const sourceAccount = await stellarClient.getAccount(sourceKeypair.publicKey());
        const fee = await stellarClient.fetchBaseFee();

        const asset =
          recipient.currency === 'USDC'
            ? stellarClient.getUSDCAsset()
            : stellarClient.getNativeAsset();

        const tx = new TransactionBuilder(sourceAccount, { fee, networkPassphrase: network })
          .addMemo(Memo.text(payrollId.substring(0, 28)))
          .addOperation(
            Operation.payment({
              destination: recipient.walletAddress,
              asset,
              amount: recipient.amount,
            })
          )
          .setTimeout(180)
          .build();

        tx.sign(sourceKeypair);
        const response = await server.submitTransaction(tx);

        results.push({
          payrollItemId: recipient.payrollItemId,
          success: true,
          txHash: response.hash,
          ledger: (response as any).ledger as number,
        });
      } catch (err: any) {
        const errMsg = err?.response?.data?.extras?.result_codes
          ? JSON.stringify(err.response.data.extras.result_codes)
          : err.message;

        results.push({
          payrollItemId: recipient.payrollItemId,
          success: false,
          error: errMsg,
        });
      }
    }

    return results;
  }

  async buildUnsignedXDR(
    sourcePublicKey: string,
    recipients: PayoutRecipient[],
    payrollId: string,
    memo?: string
  ): Promise<string> {
    const network = stellarClient.getNetwork();
    const sourceAccount = await stellarClient.getAccount(sourcePublicKey);
    const fee = await stellarClient.fetchBaseFee();

    const memoText = (memo || payrollId).substring(0, 28);
    const txBuilder = new TransactionBuilder(sourceAccount, { fee, networkPassphrase: network })
      .addMemo(Memo.text(memoText))
      .setTimeout(180);

    for (const recipient of recipients) {
      const asset = recipient.currency === 'USDC'
        ? stellarClient.getUSDCAsset()
        : stellarClient.getNativeAsset();

      txBuilder.addOperation(
        Operation.payment({
          destination: recipient.walletAddress,
          asset,
          amount: recipient.amount,
        })
      );
    }

    return txBuilder.build().toXDR();
  }

  async submitSignedXDR(signedXDR: string): Promise<{ hash: string; ledger: number }> {
    const server = stellarClient.getServer();
    const network = stellarClient.getNetwork();
    const tx = new Transaction(signedXDR, network);
    const response = await server.submitTransaction(tx);
    return { hash: response.hash, ledger: (response as any).ledger as number };
  }
}

export const bulkPayoutEngine = new BulkPayoutEngine();
