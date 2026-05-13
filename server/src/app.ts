import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import loansRoutes from './routes/loans.routes.js';
import coachRoutes from './routes/coach.routes.js';
import categorizationRoutes from './routes/categorization.routes.js';
import insightsRoutes from './routes/insights.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: env.isProd }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimit.authMax,
  skipSuccessfulRequests: true,
});
app.use('/api/auth', authLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/categorize', categorizationRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

export default app;
