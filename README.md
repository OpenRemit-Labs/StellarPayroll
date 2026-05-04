# StellarPayroll

**Open-source global payroll infrastructure built on Stellar.**  
Pay employees and contractors across borders instantly using XLM and USDC — with near-zero fees and full on-chain transparency.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Powered%20by-Stellar-0066CC)](https://stellar.org)
[![Network](https://img.shields.io/badge/Network-Testnet%20%7C%20Mainnet-green)](https://horizon-testnet.stellar.org)

---

## The Problem

Traditional global payroll is broken:

| Pain Point | Traditional Payroll | StellarPayroll |
|---|---|---|
| Transfer fees | 3–7% per transaction | ~$0.00001 per payment |
| Settlement time | 2–5 business days | 3–5 seconds |
| Coverage | Limited to banked workers | Anyone with a Stellar wallet |
| Transparency | Opaque intermediaries | On-chain, auditable |
| Bulk payments | Manual, error-prone | One-click, batched |

Remote workers in Nigeria, Kenya, Argentina, and Southeast Asia lose significant income to FX fees and slow settlement. StellarPayroll eliminates that.

---

## Why Stellar

- **Fast**: Transactions settle in 3–5 seconds
- **Cheap**: Base fee is 100 stroops (~$0.00001)
- **Stablecoins**: Native USDC support eliminates FX volatility for employees
- **Inclusive**: No bank account required — just a Stellar wallet
- **Transparent**: Every payment is publicly verifiable on-chain

---

## How It Works

```
Employer creates payroll batch
        ↓
Add employees + set amounts (XLM or USDC)
        ↓
Review summary (total, fees, FX equivalent)
        ↓
Sign with Stellar keypair (non-custodial)
        ↓
Bulk payment transaction submitted to Horizon
        ↓
Up to 100 payments in a single transaction
        ↓
Each employee receives funds in ~5 seconds
        ↓
Full audit trail stored on-chain + in DB
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  Dashboard · Employees · Payroll Wizard · Txns       │
│  React + TypeScript + Vite + Tailwind + React Query  │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                Backend (Node.js/Express)              │
│  /organizations  /employees  /payrolls  /transactions│
│  BulkPayoutEngine · FXService · StellarClient        │
└──────────┬───────────────────────────┬──────────────┘
           │                           │
┌──────────▼──────────┐   ┌────────────▼──────────────┐
│   PostgreSQL         │   │   Stellar Network          │
│   Organizations      │   │   Horizon API              │
│   Employees          │   │   XLM + USDC payments      │
│   Payrolls           │   │   Batch transactions       │
│   Transactions       │   │   On-chain audit trail     │
└─────────────────────┘   └───────────────────────────┘
```

---

## Demo Flow

1. **Create organization** — enter your org name and Stellar public key
2. **Add employees** — manually or via CSV import (name, wallet, currency)
3. **Create payroll** — name it, choose XLM or USDC, set amounts per employee
4. **Review** — see total, per-recipient breakdown, estimated fees
5. **Execute** — enter your secret key (never stored), click Execute
6. **Track** — view TX hashes, ledger confirmations, per-employee status

---

## Quick Start (< 5 minutes)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Stellar testnet account ([get one free](https://laboratory.stellar.org/#account-creator?network=test))

### 1. Clone & install

```bash
git clone https://github.com/your-org/StellarPayroll.git
cd StellarPayroll

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 3. Set up database

```bash
createdb stellarpayroll
psql stellarpayroll < backend/src/db/schema.sql
```

### 4. Start services

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

### 5. Open the app

Visit [http://localhost:5173](http://localhost:5173)

Go to **Settings** → create your organization → start paying your team.

---

## Project Structure

```
StellarPayroll/
├── backend/
│   ├── src/
│   │   ├── config.ts              # Environment config
│   │   ├── index.ts               # Express app entry
│   │   ├── db/
│   │   │   ├── schema.sql         # PostgreSQL schema
│   │   │   └── client.ts          # pg Pool
│   │   ├── stellar/
│   │   │   ├── client.ts          # Horizon client wrapper
│   │   │   ├── bulkPayout.ts      # Core bulk payment engine
│   │   │   └── fxRates.ts         # FX rate service
│   │   ├── routes/
│   │   │   ├── organizations.ts
│   │   │   ├── employees.ts
│   │   │   ├── payrolls.ts        # Execute endpoint
│   │   │   └── transactions.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── errorHandler.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                   # API client functions
│   │   ├── components/            # Reusable UI components
│   │   ├── hooks/                 # React Query hooks
│   │   ├── pages/                 # Route pages
│   │   ├── store/                 # Zustand state
│   │   └── types/                 # TypeScript interfaces
│   └── package.json
├── docs/
├── scripts/
├── README.md
├── CONTRIBUTING.md
├── ROADMAP.md
└── LICENSE
```

---

## Security Model

- **Non-custodial**: Secret keys are used only for client-side signing and never stored
- **JWT auth**: Organization access protected by JWT tokens
- **No key storage**: The execute endpoint accepts a secret key per-request, uses it to sign, and discards it
- **Testnet by default**: Safe to experiment without real funds

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | JWT signing secret | — |
| `STELLAR_NETWORK` | `testnet` or `mainnet` | `testnet` |
| `STELLAR_HORIZON_URL` | Horizon endpoint | testnet URL |
| `STELLAR_USDC_ISSUER` | USDC issuer address | testnet USDC |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues are labeled in [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md).

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).
