import { Router, Request, Response } from 'express';
import { fxService } from '../stellar/fxRates';

const router = Router();

// GET /api/fx/rates
router.get('/rates', async (_req: Request, res: Response) => {
  try {
    const rates = await fxService.getAllRates();
    return res.json(rates);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
