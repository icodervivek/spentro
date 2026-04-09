import { useMutation } from '@tanstack/react-query';
import { authApi, userApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { queryClient } from '../lib/queryClient';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authApi.login(data).then((r) => r.data),
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.clear();
    },
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      authApi.register(data).then((r) => r.data),
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.clear();
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  return useMutation({
    mutationFn: async () => {
      const rt = await import('expo-secure-store').then((m) =>
        m.getItemAsync('refreshToken')
      );
      if (rt) await authApi.logout(rt).catch(() => {});
    },
    onSettled: async () => {
      await logout();
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: object | FormData) => userApi.updateMe(data).then((r) => r.data),
    onSuccess: (data) => updateUser(data.user),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(data).then((r) => r.data),
  });
