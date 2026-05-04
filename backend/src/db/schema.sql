-- StellarPayroll Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_wallet_address VARCHAR(56) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE employee_role AS ENUM ('admin', 'finance', 'employee');
CREATE TYPE payment_currency AS ENUM ('XLM', 'USDC');

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  wallet_address VARCHAR(56) NOT NULL,
  role employee_role NOT NULL DEFAULT 'employee',
  currency payment_currency NOT NULL DEFAULT 'USDC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE payroll_status AS ENUM ('draft', 'pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS payrolls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status payroll_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(20, 7) NOT NULL DEFAULT 0,
  currency payment_currency NOT NULL DEFAULT 'USDC',
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE item_status AS ENUM ('pending', 'success', 'failed');

CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(20, 7) NOT NULL,
  currency payment_currency NOT NULL,
  status item_status NOT NULL DEFAULT 'pending',
  tx_hash VARCHAR(64),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payroll_id UUID REFERENCES payrolls(id) ON DELETE SET NULL,
  stellar_tx_hash VARCHAR(64) NOT NULL,
  ledger BIGINT,
  status VARCHAR(50) NOT NULL DEFAULT 'success',
  fee_charged VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_org_id ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_org_id ON payrolls(org_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll_id ON payroll_items(payroll_id);
CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payroll_id ON transactions(payroll_id);
