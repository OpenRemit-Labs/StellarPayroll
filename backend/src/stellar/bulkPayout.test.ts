import { BulkPayoutEngine, PayoutRecipient, PayoutResult } from './bulkPayout';
import { stellarClient } from './client';
import { TransactionBuilder } from '@stellar/stellar-sdk';

jest.mock('./client', () => ({
  stellarClient: {
    getServer: jest.fn(),
    getNetwork: jest.fn(() => 'Test SDF Network ; September 2015'),
    getAccount: jest.fn(async () => ({ accountId: 'source-account' })),
    fetchBaseFee: jest.fn(async () => '100'),
    getUSDCAsset: jest.fn(() => ({ code: 'USDC' })),
    getNativeAsset: jest.fn(() => ({ code: 'XLM' })),
  },
}));

const builtTransactions: Array<{ operations: unknown[]; memo?: unknown; sign: jest.Mock }> = [];

jest.mock('@stellar/stellar-sdk', () => {
  class MockTransactionBuilder {
    private operations: unknown[] = [];
    private memo?: unknown;

    constructor(_account: unknown, _options: unknown) {}

    addMemo(memo: unknown) {
      this.memo = memo;
      return this;
    }

    addOperation(operation: unknown) {
      this.operations.push(operation);
      return this;
    }

    setTimeout(_timeout: number) {
      return this;
    }

    build() {
      const tx = { operations: this.operations, memo: this.memo, sign: jest.fn() };
      builtTransactions.push(tx);
      return tx;
    }
  }

  return {
    Keypair: {
      fromSecret: jest.fn(() => ({ publicKey: jest.fn(() => 'G_SOURCE') })),
    },
    TransactionBuilder: MockTransactionBuilder,
    Operation: {
      payment: jest.fn((args) => ({ type: 'payment', ...args })),
    },
    Asset: {
      native: jest.fn(() => ({ code: 'XLM' })),
    },
    Memo: {
      text: jest.fn((value: string) => ({ type: 'text', value })),
    },
    Networks: {
      TESTNET: 'Test SDF Network ; September 2015',
      PUBLIC: 'Public Global Stellar Network ; September 2015',
    },
  };
});

const mockedClient = stellarClient as jest.Mocked<typeof stellarClient>;

function makeRecipients(count: number): PayoutRecipient[] {
  return Array.from({ length: count }, (_, i) => ({
    walletAddress: `G_DEST_${i}`,
    amount: '12.34',
    currency: i % 2 === 0 ? 'XLM' : 'USDC',
    employeeId: `employee-${i}`,
    payrollItemId: `item-${i}`,
  }));
}

describe('BulkPayoutEngine', () => {
  let submitTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    builtTransactions.length = 0;
    submitTransaction = jest.fn(async () => ({ hash: 'tx-hash', ledger: 12345 }));
    mockedClient.getServer.mockReturnValue({ submitTransaction } as any);
  });

  it('submits one transaction with all operations for fewer than 100 recipients', async () => {
    const recipients = makeRecipients(3);

    const results = await new BulkPayoutEngine().executeBulkPayout(
      'S_SOURCE',
      recipients,
      'payroll-1',
      'June payroll'
    );

    expect(submitTransaction).toHaveBeenCalledTimes(1);
    expect(builtTransactions).toHaveLength(1);
    expect(builtTransactions[0].operations).toHaveLength(3);
    expect(results).toEqual(
      recipients.map((recipient) => ({
        payrollItemId: recipient.payrollItemId,
        success: true,
        txHash: 'tx-hash',
        ledger: 12345,
      }))
    );
  });

  it('splits batches larger than 100 recipients into multiple transactions', async () => {
    const recipients = makeRecipients(101);

    const results = await new BulkPayoutEngine().executeBulkPayout('S_SOURCE', recipients, 'payroll-2');

    expect(submitTransaction).toHaveBeenCalledTimes(2);
    expect(builtTransactions.map((tx) => tx.operations.length)).toEqual([100, 1]);
    expect(results).toHaveLength(101);
    expect(results.every((result) => result.success)).toBe(true);
  });

  it('falls back to retryIndividually when the batch submit fails', async () => {
    submitTransaction.mockRejectedValueOnce(new Error('batch failed'));
    const recipients = makeRecipients(2);
    const retryResults: PayoutResult[] = recipients.map((recipient) => ({
      payrollItemId: recipient.payrollItemId,
      success: true,
      txHash: 'retry-hash',
    }));
    const retrySpy = jest
      .spyOn(BulkPayoutEngine.prototype as any, 'retryIndividually')
      .mockResolvedValueOnce(retryResults);

    const results = await new BulkPayoutEngine().executeBulkPayout('S_SOURCE', recipients, 'payroll-3');

    expect(retrySpy).toHaveBeenCalledTimes(1);
    expect(retrySpy).toHaveBeenCalledWith(expect.anything(), recipients, 'payroll-3', mockedClient.getNetwork());
    expect(results).toEqual(retryResults);
  });

  it('marks failed individual retries without stopping successful retries', async () => {
    submitTransaction
      .mockRejectedValueOnce(new Error('batch failed'))
      .mockResolvedValueOnce({ hash: 'retry-1', ledger: 1 })
      .mockRejectedValueOnce(new Error('recipient 2 failed'))
      .mockResolvedValueOnce({ hash: 'retry-3', ledger: 3 });

    const results = await new BulkPayoutEngine().executeBulkPayout('S_SOURCE', makeRecipients(3), 'payroll-4');

    expect(submitTransaction).toHaveBeenCalledTimes(4);
    expect(results).toEqual([
      { payrollItemId: 'item-0', success: true, txHash: 'retry-1', ledger: 1 },
      { payrollItemId: 'item-1', success: false, error: 'recipient 2 failed' },
      { payrollItemId: 'item-2', success: true, txHash: 'retry-3', ledger: 3 },
    ]);
  });

  it('handles duplicate sequence number errors gracefully as failed payout results', async () => {
    submitTransaction
      .mockRejectedValueOnce(new Error('batch failed'))
      .mockRejectedValueOnce({
        response: {
          data: {
            extras: {
              result_codes: { transaction: 'tx_bad_seq' },
            },
          },
        },
      });

    await expect(
      new BulkPayoutEngine().executeBulkPayout('S_SOURCE', makeRecipients(1), 'payroll-5')
    ).resolves.toEqual([
      {
        payrollItemId: 'item-0',
        success: false,
        error: JSON.stringify({ transaction: 'tx_bad_seq' }),
      },
    ]);
  });
});
