import { apiClient } from './client';
import { Payroll, PayrollSummary, ExecuteResult, Transaction } from '../types';

export const payrollsApi = {
  list: async (orgId: string) => {
    const res = await apiClient.get<Payroll[]>(`/payrolls/org/${orgId}`);
    return res.data;
  },
  create: async (
    orgId: string,
    data: { name: string; currency: 'XLM' | 'USDC'; items: { employeeId: string; amount: string }[] }
  ) => {
    const res = await apiClient.post<Payroll>(`/payrolls/org/${orgId}`, data);
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get<Payroll>(`/payrolls/${id}`);
    return res.data;
  },
  getSummary: async (id: string) => {
    const res = await apiClient.get<PayrollSummary>(`/payrolls/${id}/summary`);
    return res.data;
  },
  execute: async (id: string, sourceSecretKey: string) => {
    const res = await apiClient.post<ExecuteResult>(`/payrolls/${id}/execute`, { sourceSecretKey });
    return res.data;
  },
};

export const transactionsApi = {
  list: async (orgId: string) => {
    const res = await apiClient.get<Transaction[]>(`/transactions/org/${orgId}`);
    return res.data;
  },
  getStatus: async (txHash: string) => {
    const res = await apiClient.get(`/transactions/${txHash}/status`);
    return res.data;
  },
};
