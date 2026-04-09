import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../lib/api';
import { Group } from '../types';

export const GROUPS_KEY = ['groups'];
export const groupKey = (id: string) => ['group', id];

export const useGroups = () =>
  useQuery<Group[]>({
    queryKey: GROUPS_KEY,
    queryFn: () => groupApi.list().then((r) => r.data.groups),
  });

export const useGroup = (id: string) =>
  useQuery<Group>({
    queryKey: groupKey(id),
    queryFn: () => groupApi.get(id).then((r) => r.data.group),
    enabled: !!id,
  });

export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; address?: string }) =>
      groupApi.create(data).then((r) => r.data.group),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
};

export const useJoinGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      groupApi.join(inviteCode).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
};

export const useUpdateGroup = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) =>
      groupApi.update(id, data).then((r) => r.data.group),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKey(id) });
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
};

export const useLeaveGroup = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => groupApi.leave(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GROUPS_KEY }),
  });
};

export const useRemoveMember = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      groupApi.removeMember(groupId, userId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKey(groupId) });
      qc.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
};
