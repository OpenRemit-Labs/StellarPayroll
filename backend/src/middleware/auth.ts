import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
  walletAddress: string;
  orgId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(walletAddress: string, orgId?: string): string {
  return jwt.sign({ walletAddress, orgId }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
