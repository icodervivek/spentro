import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { expenseApi } from '../lib/api';
import { Expense, Pagination } from '../types';

export const expensesKey = (groupId: string, params?: object) => [
  'expenses',
  groupId,
  params,
];

export const useExpenses = (
  groupId: string,
  params?: { month?: string; category?: string; limit?: number }
) =>
  useQuery<{ expenses: Expense[]; pagination: Pagination }>({
    queryKey: expensesKey(groupId, params),
    queryFn: () =>
      expenseApi.list(groupId, params).then((r) => r.data),
    enabled: !!groupId,
  });

export const useExpense = (id: string, groupId: string) =>
  useQuery<Expense>({
    queryKey: ['expense', id],
    queryFn: () => expenseApi.get(id, groupId).then((r) => r.data.expense),
    enabled: !!id && !!groupId,
  });

export const useCreateExpense = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      expenseApi.create(formData).then((r) => r.data.expense),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
};

export const useUpdateExpense = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      expenseApi.update(id, data).then((r) => r.data.expense),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
};

export const useDeleteExpense = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      expenseApi.delete(id, groupId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', groupId] });
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
};
