import { Router } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();
router.use(authenticate);

const createValidation = [
  body('institutionName').trim().notEmpty().withMessage('Institution name required'),
  body('accountName').optional().trim(),
  body('accountType').optional().trim(),
  body('mask').optional().trim().isLength({ max: 10 }),
];

router.get('/', async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId, isActive: true },
      orderBy: { linkedAt: 'desc' },
    });
    res.json(accounts);
  } catch (err) {
    next(err);
  }
});

router.post('/link', async (req, res, next) => {
  try {
    const institutions = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One'];
    const name = institutions[Math.floor(Math.random() * institutions.length)];
    const account = await prisma.account.create({
      data: {
        userId: req.user!.userId,
        institutionName: name,
        accountName: `${name} Checking`,
        accountType: 'checking',
        mask: String(Math.floor(Math.random() * 9000) + 1000),
        currentBalance: Math.floor(Math.random() * 50000) / 100,
      },
    });
    const merchants = ['Amazon', 'Starbucks', 'Walmart', 'Netflix', 'Spotify', 'Shell', 'Whole Foods', 'Uber', 'Target'];
    const categories = [['Food and Drink', 'Restaurants'], ['Travel', 'Gas'], ['Entertainment', 'Streaming'], ['Shopping', 'Online'], ['Bills', 'Utilities']];
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const [cat, sub] = categories[Math.floor(Math.random() * categories.length)];
      const amt = -(Math.floor(Math.random() * 15000) + 500) / 100;
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          amount: amt,
          date: d,
          name: merchants[i % merchants.length],
          merchantName: merchants[i % merchants.length],
          category: cat,
          subcategory: sub,
        },
      });
    }
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/sync', validate([param('id').isUUID()]), async (req, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!account) throw new AppError(404, 'Account not found', 'NOT_FOUND');
    const merchants = ['Amazon', 'Starbucks', 'Walmart', 'Netflix', 'Target'];
    const categories = [['Food and Drink', 'Groceries'], ['Travel', 'Gas'], ['Entertainment', 'Streaming']];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * 7));
      const [cat, sub] = categories[i % categories.length];
      await prisma.transaction.create({
        data: {
          accountId: account.id,
          amount: -(Math.floor(Math.random() * 5000) + 100) / 100,
          date: d,
          name: merchants[i],
          merchantName: merchants[i],
          category: cat,
          subcategory: sub,
        },
      });
    }
    res.json({ synced: 5 });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createValidation), async (req, res, next) => {
  try {
    const account = await prisma.account.create({
      data: {
        userId: req.user!.userId,
        institutionName: req.body.institutionName,
        accountName: req.body.accountName,
        accountType: req.body.accountType ?? 'checking',
        mask: req.body.mask,
      },
    });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', validate([param('id').isUUID()]), async (req, res, next) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!account) throw new AppError(404, 'Account not found', 'NOT_FOUND');
    res.json(account);
  } catch (err) {
    next(err);
  }
});

export default router;
