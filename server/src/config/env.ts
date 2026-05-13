import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  jwt: {
    secret: process.env.JWT_SECRET ?? process.env.JWT_ACCESS_SECRET ?? 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? process.env.JWT_ACCESS_EXPIRY ?? '15m',
  },
  corsOrigin:
    process.env.CORS_ORIGIN ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'),
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    authMax: 5,
    coachMax: 20,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
} as const;
