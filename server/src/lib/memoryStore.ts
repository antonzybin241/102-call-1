import { randomUUID } from 'crypto';

type JsonValue = string | number | boolean | null | Date;

interface User {
  id: string;
  walletAddress: string | null;
  email: string | null;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Account {
  id: string;
  userId: string;
  institutionName: string;
  accountName: string | null;
  accountType: string | null;
  mask: string | null;
  currentBalance: number;
  isActive: boolean;
  linkedAt: Date;
}

interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  date: Date;
  name: string | null;
  merchantName: string | null;
  category: string | null;
  subcategory: string | null;
  notes: string | null;
  createdAt: Date;
}

interface Budget {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  period: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CategorizationFeedback {
  id: string;
  userId: string;
  transactionId: string | null;
  merchantName: string;
  amount: number;
  description: string | null;
  originalCategory: string | null;
  userCategory: string;
  userSubcategory: string | null;
  createdAt: Date;
}

interface FraudSignal {
  id: string;
  userId: string;
  signalType: string;
  severity: string;
  description: string | null;
  createdAt: Date;
}

interface LoanEligibilityResult {
  id: string;
  userId: string;
  riskScore: number;
  decision: string;
  reasonCodes: string;
  factors: string;
  recommendedLimit: number | null;
  modelVersion: string;
  createdAt: Date;
}

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

interface Loan {
  id: string;
  userId: string;
  amount: number;
  interestRatePct: number;
  termMonths: number;
  monthlyPayment: number;
  status: string;
  appliedAt: Date;
  approvedAt: Date | null;
  disbursedAt: Date | null;
}

type WhereValue =
  | JsonValue
  | { in?: JsonValue[] }
  | { gte?: Date | number; lte?: Date | number; lt?: Date | number }
  | { contains?: string }
  | Record<string, unknown>;

type WhereClause = Record<string, WhereValue | WhereValue[] | undefined> & {
  OR?: WhereClause[];
  AND?: WhereClause[];
};

type SelectClause = Record<string, boolean | SelectClause>;
type OrderByClause = Record<string, 'asc' | 'desc'>;

const users = new Map<string, User>();
const accounts = new Map<string, Account>();
const transactions = new Map<string, Transaction>();
const budgets = new Map<string, Budget>();
const categorizationFeedback = new Map<string, CategorizationFeedback>();
const fraudSignals = new Map<string, FraudSignal>();
const loanEligibilityResults = new Map<string, LoanEligibilityResult>();
const auditLogs = new Map<string, AuditLog>();
const loans = new Map<string, Loan>();

function now(): Date {
  return new Date();
}

function compareValues(left: JsonValue, right: JsonValue): number {
  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime();
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return String(left).localeCompare(String(right));
}

function matchesOperator(value: JsonValue, operator: Record<string, unknown>): boolean {
  if ('in' in operator) {
    const values = operator.in as JsonValue[];
    return values.includes(value);
  }

  if ('contains' in operator && typeof operator.contains === 'string') {
    return typeof value === 'string' && value.toLowerCase().includes(operator.contains.toLowerCase());
  }

  if ('gte' in operator && operator.gte !== undefined) {
    if (compareValues(value, operator.gte as JsonValue) < 0) return false;
  }
  if ('lte' in operator && operator.lte !== undefined) {
    if (compareValues(value, operator.lte as JsonValue) > 0) return false;
  }
  if ('lt' in operator && operator.lt !== undefined) {
    if (compareValues(value, operator.lt as JsonValue) >= 0) return false;
  }

  return true;
}

function matchesWhere<T extends Record<string, unknown>>(
  record: T,
  where: WhereClause | undefined,
  model: string
): boolean {
  if (!where) return true;

  if (where.OR?.length) {
    if (!where.OR.some((clause) => matchesWhere(record, clause, model))) return false;
  }

  if (where.AND?.length) {
    if (!where.AND.every((clause) => matchesWhere(record, clause, model))) return false;
  }

  for (const [key, expected] of Object.entries(where)) {
    if (key === 'OR' || key === 'AND') continue;
    if (expected === undefined) continue;

    if (key === 'account' && model === 'transaction') {
      const account = accounts.get(String(record.accountId));
      if (!account || !matchesWhere(account, expected as WhereClause, 'account')) return false;
      continue;
    }

    if (key === 'user' && model === 'loan') {
      const user = users.get(String(record.userId));
      if (!user || !matchesWhere(user, expected as WhereClause, 'user')) return false;
      continue;
    }

    const actual = record[key] as JsonValue;

    if (expected !== null && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if (!matchesOperator(actual, expected as Record<string, unknown>)) return false;
      continue;
    }

    if (actual !== expected) return false;
  }

  return true;
}

function applySelect<T extends Record<string, unknown>>(record: T, select?: SelectClause): Partial<T> {
  if (!select) return { ...record };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(select)) {
    if (value === true) {
      result[key] = record[key];
    } else if (typeof value === 'object' && value !== null) {
      const nested = record[key];
      if (nested && typeof nested === 'object') {
        result[key] = applySelect(nested as Record<string, unknown>, value as SelectClause);
      }
    }
  }
  return result as Partial<T>;
}

function sortRecords<T extends Record<string, unknown>>(records: T[], orderBy?: OrderByClause): T[] {
  if (!orderBy) return records;

  const [field, direction] = Object.entries(orderBy)[0] ?? [];
  if (!field) return records;

  return [...records].sort((left, right) => {
    const comparison = compareValues(left[field] as JsonValue, right[field] as JsonValue);
    return direction === 'desc' ? -comparison : comparison;
  });
}

function createModelApi<T extends Record<string, unknown>>(
  store: Map<string, T>,
  model: string,
  defaults: (data: Record<string, unknown>) => T
) {
  return {
    async findMany(args: {
      where?: WhereClause;
      select?: SelectClause;
      orderBy?: OrderByClause;
      take?: number;
      include?: Record<string, { select?: SelectClause }>;
    } = {}) {
      let records = [...store.values()].filter((record) => matchesWhere(record, args.where, model));
      records = sortRecords(records, args.orderBy);
      if (args.take != null) records = records.slice(0, args.take);

      return records.map((record) => {
        let shaped: Record<string, unknown> = { ...record };

        if (args.include) {
          for (const [relation, config] of Object.entries(args.include)) {
            if (relation === 'account' && model === 'transaction') {
              const account = accounts.get(String(record.accountId));
              shaped.account = account ? applySelect(account, config.select) : null;
            }
            if (relation === 'user' && model === 'loan') {
              const user = users.get(String(record.userId));
              shaped.user = user ? applySelect(user, config.select) : null;
            }
          }
        }

        if (args.select) shaped = applySelect(shaped, args.select) as Record<string, unknown>;
        return shaped;
      });
    },

    async findFirst(args: { where?: WhereClause; select?: SelectClause } = {}) {
      const [record] = await this.findMany({ ...args, take: 1 });
      return record ?? null;
    },

    async findUnique(args: { where: WhereClause; select?: SelectClause }) {
      const where = { ...args.where };
      if (where.email && where.isActive !== undefined) {
        return this.findFirst({ where, select: args.select });
      }
      if (where.id) {
        const record = store.get(String(where.id));
        if (!record || !matchesWhere(record, where, model)) return null;
        return args.select ? applySelect(record, args.select) : { ...record };
      }
      if (where.walletAddress) {
        return this.findFirst({ where, select: args.select });
      }
      return this.findFirst({ where, select: args.select });
    },

    async findUniqueOrThrow(args: { where: WhereClause; select?: SelectClause }) {
      const record = await this.findUnique(args);
      if (!record) throw new Error(`${model} not found`);
      return record;
    },

    async create(args: { data: Record<string, unknown>; select?: SelectClause }) {
      const record = defaults(args.data);
      store.set(String(record.id), record);
      return args.select ? applySelect(record, args.select) : { ...record };
    },

    async update(args: { where: { id: string }; data: Record<string, unknown> }) {
      const existing = store.get(args.where.id);
      if (!existing) throw new Error(`${model} not found`);
      const updated = { ...existing, ...args.data, updatedAt: now() } as T;
      store.set(args.where.id, updated);
      return { ...updated };
    },

    async updateMany(args: { where?: WhereClause; data: Record<string, unknown> }) {
      let count = 0;
      for (const [id, record] of store.entries()) {
        if (!matchesWhere(record, args.where, model)) continue;
        store.set(id, { ...record, ...args.data, updatedAt: now() } as T);
        count += 1;
      }
      return { count };
    },

    async deleteMany(args: { where?: WhereClause }) {
      let count = 0;
      for (const [id, record] of store.entries()) {
        if (!matchesWhere(record, args.where, model)) continue;
        store.delete(id);
        count += 1;
      }
      return { count };
    },

    async aggregate(args: { where?: WhereClause; _sum?: { currentBalance?: boolean } }) {
      const records = [...store.values()].filter((record) => matchesWhere(record, args.where, model));
      const sumField = args._sum?.currentBalance ? 'currentBalance' : null;
      const total = sumField
        ? records.reduce((sum, record) => sum + Number(record[sumField] ?? 0), 0)
        : 0;
      return { _sum: { currentBalance: sumField ? total : null } };
    },
  };
}

export const prisma = {
  user: createModelApi(users, 'user', (data) => ({
    id: randomUUID(),
    walletAddress: (data.walletAddress as string | null | undefined) ?? null,
    email: (data.email as string | null | undefined) ?? null,
    passwordHash: (data.passwordHash as string | null | undefined) ?? null,
    firstName: (data.firstName as string | null | undefined) ?? null,
    lastName: (data.lastName as string | null | undefined) ?? null,
    role: (data.role as string | undefined) ?? 'user',
    isActive: (data.isActive as boolean | undefined) ?? true,
    createdAt: now(),
    updatedAt: now(),
  })),
  account: createModelApi(accounts, 'account', (data) => ({
    id: randomUUID(),
    userId: String(data.userId),
    institutionName: String(data.institutionName),
    accountName: (data.accountName as string | null | undefined) ?? null,
    accountType: (data.accountType as string | null | undefined) ?? null,
    mask: (data.mask as string | null | undefined) ?? null,
    currentBalance: Number(data.currentBalance ?? 0),
    isActive: (data.isActive as boolean | undefined) ?? true,
    linkedAt: now(),
  })),
  transaction: createModelApi(transactions, 'transaction', (data) => ({
    id: randomUUID(),
    accountId: String(data.accountId),
    amount: Number(data.amount ?? 0),
    date: data.date instanceof Date ? data.date : new Date(String(data.date)),
    name: (data.name as string | null | undefined) ?? null,
    merchantName: (data.merchantName as string | null | undefined) ?? null,
    category: (data.category as string | null | undefined) ?? null,
    subcategory: (data.subcategory as string | null | undefined) ?? null,
    notes: (data.notes as string | null | undefined) ?? null,
    createdAt: now(),
  })),
  budget: createModelApi(budgets, 'budget', (data) => ({
    id: randomUUID(),
    userId: String(data.userId),
    name: String(data.name),
    category: String(data.category),
    amount: Number(data.amount ?? 0),
    period: (data.period as string | undefined) ?? 'monthly',
    startDate: data.startDate instanceof Date ? data.startDate : new Date(String(data.startDate)),
    endDate: data.endDate == null ? null : data.endDate instanceof Date ? data.endDate : new Date(String(data.endDate)),
    createdAt: now(),
    updatedAt: now(),
  })),
  categorizationFeedback: createModelApi(categorizationFeedback, 'categorizationFeedback', (data) => ({
    id: randomUUID(),
    userId: String(data.userId),
    transactionId: (data.transactionId as string | null | undefined) ?? null,
    merchantName: String(data.merchantName),
    amount: Number(data.amount ?? 0),
    description: (data.description as string | null | undefined) ?? null,
    originalCategory: (data.originalCategory as string | null | undefined) ?? null,
    userCategory: String(data.userCategory),
    userSubcategory: (data.userSubcategory as string | null | undefined) ?? null,
    createdAt: now(),
  })),
  fraudSignal: createModelApi(fraudSignals, 'fraudSignal', (data) => ({
    id: randomUUID(),
    userId: String(data.userId),
    signalType: String(data.signalType),
    severity: String(data.severity),
    description: (data.description as string | null | undefined) ?? null,
    createdAt: now(),
  })),
  loanEligibilityResult: createModelApi(loanEligibilityResults, 'loanEligibilityResult', (data) => ({
    id: randomUUID(),
    userId: String(data.userId),
    riskScore: Number(data.riskScore),
    decision: String(data.decision),
    reasonCodes: String(data.reasonCodes),
    factors: String(data.factors),
    recommendedLimit: data.recommendedLimit == null ? null : Number(data.recommendedLimit),
    modelVersion: String(data.modelVersion),
    createdAt: now(),
  })),
  auditLog: createModelApi(auditLogs, 'auditLog', (data) => ({
    id: randomUUID(),
    userId: (data.userId as string | null | undefined) ?? null,
    action: String(data.action),
    resourceType: (data.resourceType as string | null | undefined) ?? null,
    resourceId: (data.resourceId as string | null | undefined) ?? null,
    details: (data.details as string | null | undefined) ?? null,
    ipAddress: (data.ipAddress as string | null | undefined) ?? null,
    createdAt: now(),
  })),
  loan: createModelApi(loans, 'loan', (data) => ({
    id: randomUUID(),
    userId: String(data.userId),
    amount: Number(data.amount ?? 0),
    interestRatePct: Number(data.interestRatePct),
    termMonths: Number(data.termMonths),
    monthlyPayment: Number(data.monthlyPayment),
    status: (data.status as string | undefined) ?? 'pending',
    appliedAt: now(),
    approvedAt: null,
    disbursedAt: null,
  })),
};
