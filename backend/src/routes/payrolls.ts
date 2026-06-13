import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db/client';
import { bulkPayoutEngine } from '../stellar/bulkPayout';
import { fxService } from '../stellar/fxRates';

const router = Router();

// GET /api/payrolls/org/:orgId
router.get('/org/:orgId', async (req: Request, res: Response) => {
  const { rows } = await db.query(
    'SELECT * FROM payrolls WHERE org_id = $1 ORDER BY created_at DESC',
    [req.params.orgId]
  );
  return res.json(rows);
});

// POST /api/payrolls/org/:orgId — create payroll with items
router.post(
  '/org/:orgId',
  [
    body('name').trim().notEmpty(),
    body('currency').isIn(['XLM', 'USDC']),
    body('items').isArray({ min: 1 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, currency, items, scheduled_at } = req.body;
    const total = items.reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const { rows: [payroll] } = await client.query(
        'INSERT INTO payrolls (org_id, name, currency, total_amount, scheduled_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [req.params.orgId, name, currency, total, scheduled_at || null]
      );

      for (const item of items) {
        await client.query(
          'INSERT INTO payroll_items (payroll_id, employee_id, amount, currency) VALUES ($1,$2,$3,$4)',
          [payroll.id, item.employeeId, item.amount, currency]
        );
      }

      await client.query('COMMIT');
      return res.status(201).json(payroll);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
);

// GET /api/payrolls/:id — with items + employee details
router.get('/:id', async (req: Request, res: Response) => {
  const { rows: [payroll] } = await db.query('SELECT * FROM payrolls WHERE id = $1', [req.params.id]);
  if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

  const { rows: items } = await db.query(
    `SELECT pi.*, e.name as employee_name, e.email, e.wallet_address
     FROM payroll_items pi
     JOIN employees e ON e.id = pi.employee_id
     WHERE pi.payroll_id = $1`,
    [req.params.id]
  );

  return res.json({ ...payroll, items });
});

// GET /api/payrolls/:id/summary — with FX rates
router.get('/:id/summary', async (req: Request, res: Response) => {
  const { rows: [payroll] } = await db.query('SELECT * FROM payrolls WHERE id = $1', [req.params.id]);
  if (!payroll) return res.status(404).json({ error: 'Payroll not found' });

  const { rows: items } = await db.query(
    `SELECT pi.*, e.name as employee_name, e.wallet_address
     FROM payroll_items pi JOIN employees e ON e.id = pi.employee_id
     WHERE pi.payroll_id = $1`,
    [req.params.id]
  );

  const rates = await fxService.getRates(payroll.currency);
  const feePerOp = 0.00001; // XLM base fee
  const estimatedFee = items.length * feePerOp;

  return res.json({
    payroll,
    items,
    fxRates: rates,
    estimatedFee,
    totalFiatUSD: parseFloat(payroll.total_amount) * rates.USD,
  });
});

// POST /api/payrolls/:id/execute — CORE: execute bulk payout
router.post('/:id/execute', async (req: Request, res: Response) => {
  const { sourceSecretKey } = req.body;
  if (!sourceSecretKey) {
    return res.status(400).json({ error: 'sourceSecretKey is required' });
  }

  const { rows: [payroll] } = await db.query('SELECT * FROM payrolls WHERE id = $1', [req.params.id]);
  if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
  if (payroll.status === 'completed') {
    return res.status(400).json({ error: 'Payroll already completed' });
  }

  // Mark as processing
  await db.query("UPDATE payrolls SET status = 'processing' WHERE id = $1", [payroll.id]);

  const { rows: items } = await db.query(
    `SELECT pi.*, e.wallet_address
     FROM payroll_items pi JOIN employees e ON e.id = pi.employee_id
     WHERE pi.payroll_id = $1 AND pi.status = 'pending'`,
    [payroll.id]
  );

  if (!items.length) {
    return res.status(400).json({ error: 'No pending items to process' });
  }

  const recipients = items.map((item: any) => ({
    walletAddress: item.wallet_address,
    amount: item.amount.toString(),
    currency: item.currency as 'XLM' | 'USDC',
    employeeId: item.employee_id,
    payrollItemId: item.id,
  }));

  try {
    const results = await bulkPayoutEngine.executeBulkPayout(
      sourceSecretKey,
      recipients,
      payroll.id,
      `PAY-${payroll.id.substring(0, 20)}`
    );

    // Update each item's status
    const txHashes = new Set<string>();
    let successCount = 0;
    let failCount = 0;

    for (const result of results) {
      if (result.success) {
        await db.query(
          "UPDATE payroll_items SET status = 'success', tx_hash = $1 WHERE id = $2",
          [result.txHash, result.payrollItemId]
        );
        if (result.txHash) txHashes.add(result.txHash);
        successCount++;
      } else {
        await db.query(
          "UPDATE payroll_items SET status = 'failed', error_message = $1 WHERE id = $2",
          [result.error, result.payrollItemId]
        );
        failCount++;
      }
    }

    // Record transactions
    for (const txHash of txHashes) {
      const result = results.find((r) => r.txHash === txHash);
      await db.query(
        'INSERT INTO transactions (org_id, payroll_id, stellar_tx_hash, ledger, status) VALUES ($1,$2,$3,$4,$5)',
        [payroll.org_id, payroll.id, txHash, result?.ledger || null, 'success']
      );
    }

    const finalStatus = failCount === 0 ? 'completed' : successCount === 0 ? 'failed' : 'completed';
    await db.query(
      "UPDATE payrolls SET status = $1, executed_at = NOW() WHERE id = $2",
      [finalStatus, payroll.id]
    );

    return res.json({
      payrollId: payroll.id,
      status: finalStatus,
      successCount,
      failCount,
      results,
    });
  } catch (err: any) {
    await db.query("UPDATE payrolls SET status = 'failed' WHERE id = $1", [payroll.id]);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/payrolls/:id/xdr — build unsigned XDR for Freighter signing
router.get('/:id/xdr', async (req: Request, res: Response) => {
  const { sourcePublicKey } = req.query as { sourcePublicKey?: string };
  if (!sourcePublicKey) {
    return res.status(400).json({ error: 'sourcePublicKey query param is required' });
  }

  const { rows: [payroll] } = await db.query('SELECT * FROM payrolls WHERE id = $1', [req.params.id]);
  if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
  if (payroll.status === 'completed') {
    return res.status(400).json({ error: 'Payroll already completed' });
  }

  const { rows: items } = await db.query(
    `SELECT pi.*, e.wallet_address
     FROM payroll_items pi JOIN employees e ON e.id = pi.employee_id
     WHERE pi.payroll_id = $1 AND pi.status = 'pending'`,
    [payroll.id]
  );

  if (!items.length) {
    return res.status(400).json({ error: 'No pending items to process' });
  }

  const recipients = items.map((item: any) => ({
    walletAddress: item.wallet_address,
    amount: item.amount.toString(),
    currency: item.currency as 'XLM' | 'USDC',
    employeeId: item.employee_id,
    payrollItemId: item.id,
  }));

  try {
    const xdr = await bulkPayoutEngine.buildUnsignedXDR(
      sourcePublicKey,
      recipients,
      payroll.id,
      `PAY-${payroll.id.substring(0, 20)}`
    );
    return res.json({ xdr, payrollItemIds: items.map((i: any) => i.id) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/payrolls/:id/execute-xdr — submit a Freighter-signed XDR
router.post('/:id/execute-xdr', async (req: Request, res: Response) => {
  const { signedXDR } = req.body;
  if (!signedXDR) {
    return res.status(400).json({ error: 'signedXDR is required' });
  }

  const { rows: [payroll] } = await db.query('SELECT * FROM payrolls WHERE id = $1', [req.params.id]);
  if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
  if (payroll.status === 'completed') {
    return res.status(400).json({ error: 'Payroll already completed' });
  }

  await db.query("UPDATE payrolls SET status = 'processing' WHERE id = $1", [payroll.id]);

  const { rows: items } = await db.query(
    `SELECT pi.id FROM payroll_items pi WHERE pi.payroll_id = $1 AND pi.status = 'pending'`,
    [payroll.id]
  );

  if (!items.length) {
    return res.status(400).json({ error: 'No pending items to process' });
  }

  try {
    const { hash: txHash, ledger } = await bulkPayoutEngine.submitSignedXDR(signedXDR);

    for (const item of items) {
      await db.query(
        "UPDATE payroll_items SET status = 'success', tx_hash = $1 WHERE id = $2",
        [txHash, item.id]
      );
    }

    await db.query(
      'INSERT INTO transactions (org_id, payroll_id, stellar_tx_hash, ledger, status) VALUES ($1,$2,$3,$4,$5)',
      [payroll.org_id, payroll.id, txHash, ledger || null, 'success']
    );

    await db.query(
      "UPDATE payrolls SET status = 'completed', executed_at = NOW() WHERE id = $1",
      [payroll.id]
    );

    const results = items.map((item: any) => ({
      payrollItemId: item.id,
      success: true,
      txHash,
      ledger,
    }));

    return res.json({
      payrollId: payroll.id,
      status: 'completed',
      successCount: items.length,
      failCount: 0,
      results,
    });
  } catch (err: any) {
    for (const item of items) {
      await db.query(
        "UPDATE payroll_items SET status = 'failed', error_message = $1 WHERE id = $2",
        [err.message, item.id]
      );
    }
    await db.query("UPDATE payrolls SET status = 'failed' WHERE id = $1", [payroll.id]);

    const results = items.map((item: any) => ({
      payrollItemId: item.id,
      success: false,
      error: err.message,
    }));

    return res.json({
      payrollId: payroll.id,
      status: 'failed',
      successCount: 0,
      failCount: items.length,
      results,
    });
  }
});

export default router;
