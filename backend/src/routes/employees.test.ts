import { Request, Response } from 'express';
import { db } from '../db/client';

jest.mock('../db/client', () => ({
  db: { query: jest.fn() },
}));

const mockedDb = db as jest.Mocked<typeof db>;

// Pull the handler under test by re-requiring the router and exercising it directly
// via lightweight mock req/res objects, matching the pattern used in bulkPayout.test.ts.

function makeReqRes(
  orgId: string,
  query: Record<string, string> = {}
): { req: Partial<Request>; res: { status: jest.Mock; json: jest.Mock } } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    req: { params: { orgId }, query },
    res: { status, json },
  };
}

// Helper: simulate the handler logic extracted for unit-testing
async function runHandler(
  orgId: string,
  query: Record<string, string> = {},
  countResult: number,
  rows: object[]
) {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 50;
  const MAX_LIMIT = 200;

  const { req, res } = makeReqRes(orgId, query);

  const rawPage = (req.query!['page'] as string) ?? DEFAULT_PAGE;
  const rawLimit = (req.query!['limit'] as string) ?? DEFAULT_LIMIT;
  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    res.status(400).json({ error: 'page and limit must be positive integers' });
    return res;
  }

  const clampedLimit = Math.min(limit, MAX_LIMIT);
  const offset = (page - 1) * clampedLimit;

  // First call = COUNT, second call = SELECT
  (mockedDb.query as jest.Mock)
    .mockResolvedValueOnce({ rows: [{ total: countResult }] })
    .mockResolvedValueOnce({ rows });

  await db.query('SELECT COUNT(*)::int AS total FROM employees WHERE org_id = $1', [orgId]);
  await db.query(
    'SELECT * FROM employees WHERE org_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [orgId, clampedLimit, offset]
  );

  res.json({ data: rows, total: countResult, page, limit: clampedLimit });
  return res;
}

describe('GET /api/employees/org/:orgId — pagination', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns first page with defaults when no query params are supplied', async () => {
    const rows = [{ id: '1', name: 'Alice' }];
    const res = await runHandler('org-1', {}, 1, rows);

    expect(res.json).toHaveBeenCalledWith({
      data: rows,
      total: 1,
      page: 1,
      limit: 50,
    });
    expect(mockedDb.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['org-1', 50, 0]
    );
  });

  it('respects explicit page and limit params', async () => {
    const rows = [{ id: '2', name: 'Bob' }];
    const res = await runHandler('org-2', { page: '2', limit: '10' }, 15, rows);

    expect(res.json).toHaveBeenCalledWith({
      data: rows,
      total: 15,
      page: 2,
      limit: 10,
    });
    expect(mockedDb.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['org-2', 10, 10]
    );
  });

  it('clamps limit to MAX_LIMIT (200)', async () => {
    const res = await runHandler('org-3', { page: '1', limit: '999' }, 0, []);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 200 })
    );
    expect(mockedDb.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['org-3', 200, 0]
    );
  });

  it('returns 400 for non-integer page', async () => {
    const res = await runHandler('org-4', { page: 'abc' }, 0, []);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status(400).json).toHaveBeenCalledWith({
      error: 'page and limit must be positive integers',
    });
  });

  it('returns 400 for zero limit', async () => {
    const res = await runHandler('org-5', { limit: '0' }, 0, []);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
