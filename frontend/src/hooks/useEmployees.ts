import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../api/employees';
import { Employee } from '../types';

export function useEmployees(orgId: string | undefined) {
  return useQuery({
    queryKey: ['employees', orgId],
    queryFn: () => employeesApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateEmployee(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employee>) => employeesApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', orgId] }),
  });
}

export function useDeleteEmployee(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', orgId] }),
  });
}

export function useImportEmployees(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employees: Partial<Employee>[]) => employeesApi.bulkImport(orgId, employees),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees', orgId] }),
  });
}
