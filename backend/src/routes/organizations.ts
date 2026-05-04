import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/client';
import { generateToken } from '../middleware/auth';

const router = Router();

// POST /api/organizations — create org + return JWT
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('owner_wallet_address').trim().isLength({ min: 56, max: 56 }).withMessage('Invalid Stellar address'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, owner_wallet_address } = req.body;
    const { rows } = await db.query(
      'INSERT INTO organizations (name, owner_wallet_address) VALUES ($1, $2) RETURNING *',
      [name, owner_wallet_address]
    );
    const org = rows[0];
    const token = generateToken(owner_wallet_address, org.id);
    return res.status(201).json({ org, token });
  }
);

// GET /api/organizations/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { rows } = await db.query('SELECT * FROM organizations WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Organization not found' });
  return res.json(rows[0]);
});

// GET /api/organizations/:id/stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  const orgId = req.params.id;
  const [empResult, payrollResult, paidResult] = await Promise.all([
    db.query('SELECT COUNT(*) FROM employees WHERE org_id = $1', [orgId]),
    db.query('SELECT COUNT(*) FROM payrolls WHERE org_id = $1', [orgId]),
    db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM payrolls WHERE org_id = $1 AND status = 'completed'",
      [orgId]
    ),
  ]);

  const lastPayroll = await db.query(
    'SELECT * FROM payrolls WHERE org_id = $1 ORDER BY created_at DESC LIMIT 1',
    [orgId]
  );

  return res.json({
    totalEmployees: parseInt(empResult.rows[0].count, 10),
    totalPayrolls: parseInt(payrollResult.rows[0].count, 10),
    totalPaid: parseFloat(paidResult.rows[0].total),
    lastPayroll: lastPayroll.rows[0] || null,
  });
});

export default router;
