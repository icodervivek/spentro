import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../lib/api';

export const useMonthlyReport = (groupId: string, month: string) =>
  useQuery({
    queryKey: ['report', 'monthly', groupId, month],
    queryFn: () => reportApi.monthly(groupId, month).then((r) => r.data),
    enabled: !!groupId && !!month,
  });

export const useCategoryReport = (groupId: string, from?: string, to?: string) =>
  useQuery({
    queryKey: ['report', 'category', groupId, from, to],
    queryFn: () => reportApi.category(groupId, from, to).then((r) => r.data),
    enabled: !!groupId,
  });
