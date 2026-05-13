# FinTrust AI

Full-stack fintech app with wallet auth, bank linking, transactions, budgets, insights, AI coach with function calling, loan scoring, and admin dashboard.

## Tech Stack

- **Frontend:** React + Vite + Tailwind + Tremor
- **Backend:** Node.js + Express + Prisma
- **Database:** SQLite (file-based)
- **Auth:** Web3 wallet (EVM + Solana)
- **AI:** OpenAI API (optional, for coach)

## Setup

### 1. Environment

```bash
cp .env.example .env
# Edit .env: JWT_SECRET, optional OPENAI_API_KEY for AI coach
```

### 2. Install & DB

```bash
npm install
npm run db:push
npm run db:seed
```

### 3. Run

```bash
npm run dev
```

Opens API at http://localhost:3001 and frontend at http://localhost:5173.


## Features

- **Auth:** Connect Ethereum (MetaMask, Coinbase) or Solana (Phantom, Solflare)
- **Bank linking:** Mock Plaid (swap for real Plaid in prod)
- **Transactions:** Storage, categorization, sync
- **Budgets:** Create and track spending limits
- **Insights:** Monthly spending, charts, trends
- **AI Coach:** Chat + function calling (balance, budgets, spending, transactions) — set `OPENAI_API_KEY`
- **Loan Score:** Micro-loan eligibility from finances
- **Admin:** Users, loans, risk scores, audit logs
- **Theme:** Light/dark mode

## Project Structure

```
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── loan-scoring/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── services/
└── vite.config.ts
```

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | API + frontend (concurrent)|
| `npm run build`| Build for production       |
| `npm run db:push` | Sync Prisma schema to DB |
| `npm run db:seed` | Seed demo data          |
| `npm run db:studio` | Prisma Studio          |
