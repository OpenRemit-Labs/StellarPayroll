import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollsApi } from '../api/payrolls';

export function usePayrolls(orgId: string | undefined) {
  return useQuery({
    queryKey: ['payrolls', orgId],
    queryFn: () => payrollsApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function usePayroll(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: () => payrollsApi.get(id!),
    enabled: !!id,
  });
}

export function usePayrollSummary(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll-summary', id],
    queryFn: () => payrollsApi.getSummary(id!),
    enabled: !!id,
  });
}

export function useCreatePayroll(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof payrollsApi.create>[1]) =>
      payrollsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payrolls', orgId] }),
  });
}

export function useExecutePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sourceSecretKey }: { id: string; sourceSecretKey: string }) =>
      payrollsApi.execute(id, sourceSecretKey),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['payroll', id] });
      qc.invalidateQueries({ queryKey: ['payrolls'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useExecutePayrollXDR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signedXDR }: { id: string; signedXDR: string }) =>
      payrollsApi.executeXDR(id, signedXDR),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['payroll', id] });
      qc.invalidateQueries({ queryKey: ['payrolls'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
