import { Router } from 'express';
import { body, query } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { scoreLoanEligibility } from '../loan-scoring/index.js';
import { logAudit } from '../services/audit.service.js';

const router = Router();
router.use(authenticate);

const eligibilityBodyValidation = [body('monthlyIncomeOverride').optional().isFloat({ min: 0 })];
const eligibilityQueryValidation = [query('monthlyIncomeOverride').optional().isFloat({ min: 0 })];

const applyValidation = [
  body('amount').isFloat({ min: 100, max: 50000 }).withMessage('Loan amount should be between $100 and $50,000'),
  body('termMonths').isInt({ min: 1, max: 60 }).withMessage('Please choose a term between 1 and 60 months'),
];

function calculateMonthlyPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (annualRatePct === 0) return principal / termMonths;
  const monthlyRate = annualRatePct / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}

router.get('/eligibility', validate(eligibilityQueryValidation), async (req, res, next) => {
  try {
    const override = req.query.monthlyIncomeOverride ? parseFloat(String(req.query.monthlyIncomeOverride)) : undefined;
    const result = await scoreLoanEligibility(req.user!.userId, { monthlyIncomeOverride: override });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/eligibility', validate(eligibilityBodyValidation), async (req, res, next) => {
  try {
    const override = req.body.monthlyIncomeOverride ? parseFloat(req.body.monthlyIncomeOverride) : undefined;
    const result = await scoreLoanEligibility(req.user!.userId, { monthlyIncomeOverride: override });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/apply', validate(applyValidation), async (req, res, next) => {
  try {
    const { amount, termMonths } = req.body;
    const principal = parseFloat(amount);
    const term = parseInt(termMonths, 10);

    const ratePct = 12.99;
    const monthlyPayment = calculateMonthlyPayment(principal, ratePct, term);

    const loan = await prisma.loan.create({
      data: {
        userId: req.user!.userId,
        amount: principal,
        interestRatePct: ratePct,
        termMonths: term,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        status: 'pending',
      },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'loan_apply',
      resourceType: 'loan',
      resourceId: loan.id,
      details: { amount: principal, termMonths: term },
      ipAddress: req.ip,
    });

    res.status(201).json({
      id: loan.id,
      amount: loan.amount,
      interestRatePct: loan.interestRatePct,
      termMonths: loan.termMonths,
      monthlyPayment: loan.monthlyPayment,
      status: loan.status,
      appliedAt: loan.appliedAt,
      message: "We've got your application. We'll review it and get back to you soon.",
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.userId },
      orderBy: { appliedAt: 'desc' },
    });
    res.json(loans);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const loan = await prisma.loan.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!loan) {
      const { AppError } = await import('../middleware/error.middleware.js');
      throw new AppError(404, "We couldn't find that loan.", 'NOT_FOUND');
    }
    res.json(loan);
  } catch (err) {
    next(err);
  }
});

export default router;
