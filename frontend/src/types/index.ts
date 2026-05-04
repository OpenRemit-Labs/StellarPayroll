export interface Organization {
  id: string;
  name: string;
  owner_wallet_address: string;
  created_at: string;
}

export interface Employee {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  wallet_address: string;
  role: 'admin' | 'finance' | 'employee';
  currency: 'XLM' | 'USDC';
  created_at: string;
}

export type PayrollStatus = 'draft' | 'pending' | 'processing' | 'completed' | 'failed';
export type ItemStatus = 'pending' | 'success' | 'failed';

export interface PayrollItem {
  id: string;
  payroll_id: string;
  employee_id: string;
  amount: string;
  currency: 'XLM' | 'USDC';
  status: ItemStatus;
  tx_hash?: string;
  error_message?: string;
  employee_name?: string;
  email?: string;
  wallet_address?: string;
}

export interface Payroll {
  id: string;
  org_id: string;
  name: string;
  status: PayrollStatus;
  total_amount: string;
  currency: 'XLM' | 'USDC';
  scheduled_at?: string;
  executed_at?: string;
  created_at: string;
  items?: PayrollItem[];
}

export interface Transaction {
  id: string;
  org_id: string;
  payroll_id?: string;
  payroll_name?: string;
  stellar_tx_hash: string;
  ledger?: number;
  status: string;
  fee_charged?: string;
  created_at: string;
}

export interface OrgStats {
  totalEmployees: number;
  totalPayrolls: number;
  totalPaid: number;
  lastPayroll: Payroll | null;
}

export interface PayrollSummary {
  payroll: Payroll;
  items: PayrollItem[];
  fxRates: { USD: number; NGN: number; EUR: number; GBP: number };
  estimatedFee: number;
  totalFiatUSD: number;
}

export interface ExecuteResult {
  payrollId: string;
  status: PayrollStatus;
  successCount: number;
  failCount: number;
  results: Array<{
    payrollItemId: string;
    success: boolean;
    txHash?: string;
    ledger?: number;
    error?: string;
  }>;
}
