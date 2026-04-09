import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementApi } from '../lib/api';
import { Settlement } from '../types';

export const settlementsKey = (groupId: string) => ['settlements', groupId];

export const useSettlements = (groupId: string) =>
  useQuery<Settlement[]>({
    queryKey: settlementsKey(groupId),
    queryFn: () => settlementApi.list(groupId).then((r) => r.data.settlements),
    enabled: !!groupId,
  });

export const useCreateSettlement = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      groupId: string;
      toUser: string;
      amount: number;
      method?: string;
      note?: string;
    }) => settlementApi.create(data).then((r) => r.data.settlement),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settlementsKey(groupId) });
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
};

export const useConfirmSettlement = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      settlementApi.confirm(id, groupId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settlementsKey(groupId) });
      qc.invalidateQueries({ queryKey: ['balances', groupId] });
    },
  });
};

export const useRejectSettlement = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      settlementApi.reject(id, groupId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: settlementsKey(groupId) }),
  });
};
