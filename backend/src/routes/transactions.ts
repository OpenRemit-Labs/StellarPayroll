import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { stellarClient } from '../stellar/client';

const router = Router();

// GET /api/transactions/org/:orgId
router.get('/org/:orgId', async (req: Request, res: Response) => {
  const { rows } = await db.query(
    `SELECT t.*, p.name as payroll_name
     FROM transactions t
     LEFT JOIN payrolls p ON p.id = t.payroll_id
     WHERE t.org_id = $1
     ORDER BY t.created_at DESC
     LIMIT 100`,
    [req.params.orgId]
  );
  return res.json(rows);
});

// GET /api/transactions/:txHash/status — live check on Horizon
router.get('/:txHash/status', async (req: Request, res: Response) => {
  try {
    const server = stellarClient.getServer();
    const tx = await server.transactions().transaction(req.params.txHash).call();
    return res.json({
      hash: tx.hash,
      ledger: tx.ledger,
      successful: tx.successful,
      fee_charged: tx.fee_charged,
      created_at: tx.created_at,
    });
  } catch (err: any) {
    return res.status(404).json({ error: 'Transaction not found on Horizon' });
  }
});

export default router;
