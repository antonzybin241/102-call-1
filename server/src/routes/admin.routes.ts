import { Router } from 'express';
import { query } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, walletAddress: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/loans', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status: String(status) } : {};
    const loans = await prisma.loan.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: {
        user: { select: { id: true, walletAddress: true, email: true, firstName: true, lastName: true } },
      },
    });
    res.json(loans);
  } catch (err) {
    next(err);
  }
});

router.get('/risk-scores', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || 100), 10) || 100, 500);
    const results = await prisma.loanEligibilityResult.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const withUser = await Promise.all(
      results.map(async (r) => {
        const user = await prisma.user.findUnique({
          where: { id: r.userId },
          select: { walletAddress: true, email: true, firstName: true, lastName: true },
        });
        return {
          ...r,
          user,
          reasonCodes: parseJson(r.reasonCodes),
          factors: parseJson(r.factors),
        };
      })
    );
    res.json(withUser);
  } catch (err) {
    next(err);
  }
});

router.get('/fraud-alerts', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || 50), 10) || 50, 200);
    const signals = await prisma.fraudSignal.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const withUser = await Promise.all(
      signals.map(async (s) => {
        const user = await prisma.user.findUnique({
          where: { id: s.userId },
          select: { walletAddress: true, email: true },
        });
        return { ...s, user };
      })
    );
    res.json(withUser);
  } catch (err) {
    next(err);
  }
});

function parseJson<T = unknown>(s: string | null | undefined): T | null {
  if (!s || typeof s !== 'string') return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

router.get('/audit-logs', validate([query('limit').optional().isInt({ min: 1, max: 500 }).toInt()]), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || 100), 10) || 100, 500);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const withUser = await Promise.all(
      logs.map(async (l) => {
        const user = l.userId
          ? await prisma.user.findUnique({ where: { id: l.userId }, select: { email: true } })
          : null;
        return { ...l, userEmail: user?.email ?? user?.walletAddress, details: parseJson(l.details) };
      })
    );
    res.json(withUser);
  } catch (err) {
    next(err);
  }
});

export default router;
