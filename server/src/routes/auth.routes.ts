import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { logAudit } from '../services/audit.service.js';
import {
  createNonce,
  consumeNonce,
  verifyWalletSignature,
  findUserByWallet,
  createWalletUser,
  signWalletToken,
} from '../services/walletAuth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

const router = Router();

const nonceValidation = [body('address').trim().notEmpty().isLength({ min: 32, max: 64 })];

const verifyValidation = [
  body('address').trim().notEmpty().isLength({ min: 32, max: 64 }),
  body('message').trim().notEmpty(),
  body('signature').trim().notEmpty(),
];

router.post('/nonce', validate(nonceValidation), async (req, res, next) => {
  try {
    const address = String(req.body.address).trim();
    const nonce = createNonce(address);
    res.json({ nonce });
  } catch (err) {
    next(err);
  }
});

router.post('/verify', validate(verifyValidation), async (req, res, next) => {
  try {
    const { address, message, signature } = req.body;
    const addr = String(address).trim();

    if (!consumeNonce(addr, message)) {
      throw new AppError(401, 'Invalid or expired nonce', 'INVALID_NONCE');
    }

    const valid = await verifyWalletSignature(addr, message, signature);
    if (!valid) {
      throw new AppError(401, 'Invalid signature', 'INVALID_SIGNATURE');
    }

    let user = await findUserByWallet(addr);
    if (!user) {
      user = await createWalletUser(addr);
    }

    const token = signWalletToken(user);
    await logAudit({ userId: user.id, action: 'login', ipAddress: req.ip });

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
      expiresIn: 900,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, walletAddress: true, email: true, firstName: true, lastName: true, role: true },
    });
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');
    res.json({
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
