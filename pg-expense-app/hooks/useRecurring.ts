import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const recurringKey = (groupId: string) => ['recurring', groupId];

export const useRecurring = (groupId: string) =>
  useQuery({
    queryKey: recurringKey(groupId),
    queryFn: () =>
      api.get('/recurring', { params: { groupId } }).then((r) => r.data.templates),
    enabled: !!groupId,
  });

export const useCreateRecurring = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) =>
      api.post('/recurring', data).then((r) => r.data.template),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKey(groupId) }),
  });
};

export const useUpdateRecurring = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch(`/recurring/${id}`, { groupId, ...data }).then((r) => r.data.template),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKey(groupId) }),
  });
};

export const useDeactivateRecurring = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/recurring/${id}`, { params: { groupId } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringKey(groupId) }),
  });
};
