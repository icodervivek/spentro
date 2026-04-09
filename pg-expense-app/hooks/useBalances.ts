import { useQuery } from '@tanstack/react-query';
import { groupApi } from '../lib/api';
import { GroupBalances } from '../types';

export const balancesKey = (groupId: string) => ['balances', groupId];

export const useGroupBalances = (groupId: string) =>
  useQuery<GroupBalances>({
    queryKey: balancesKey(groupId),
    queryFn: () => groupApi.balances(groupId).then((r) => r.data),
    enabled: !!groupId,
  });

export const useMyBalance = (groupId: string) =>
  useQuery({
    queryKey: ['myBalance', groupId],
    queryFn: () => groupApi.myBalance(groupId).then((r) => r.data),
    enabled: !!groupId,
  });
