import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ─── Axios instance (JSON only) ───────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request: attach access token ────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: refresh on 401 ────────────────────────────────────────────────
let refreshing = false;
let queue: { resolve: (t: string) => void; reject: (e: unknown) => void }[] = [];

const drain = (err: unknown, token: string | null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (refreshing) {
      return new Promise<string>((resolve, reject) =>
        queue.push({ resolve, reject })
      ).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('no_refresh_token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);

      drain(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (err) {
      drain(err, null);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  }
);

// ─── Multipart upload via native fetch ───────────────────────────────────────
// axios's isFormData() check fails for React Native's FormData (toString gives
// "[object Object]" not "[object FormData]"), causing it to JSON.stringify the
// body. Native fetch handles RN FormData correctly and sets the boundary.

async function refreshTokens() {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) throw new Error('no_refresh_token');
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('refresh_failed');
  const data = await res.json();
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  return data.accessToken as string;
}

export async function multipartFetch(
  method: 'POST' | 'PATCH',
  path: string,
  formData: FormData
): Promise<{ data: any }> {
  const sendRequest = async (token: string | null) => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Do NOT set Content-Type — fetch sets multipart/form-data with boundary
    return fetch(`${BASE_URL}${path}`, { method, headers, body: formData });
  };

  let token = await SecureStore.getItemAsync('accessToken');
  let res = await sendRequest(token);

  // One refresh retry on 401
  if (res.status === 401) {
    try {
      token = await refreshTokens();
      res = await sendRequest(token);
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      const err: any = new Error('Session expired');
      err.response = { data: { message: 'Session expired' }, status: 401 };
      throw err;
    }
  }

  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data?.message ?? 'Request failed');
    err.response = { data, status: res.status };
    throw err;
  }
  return { data };
}

// ─── Typed helpers ────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// Duck-type check — plain objects don't have .append(); FormData does.
const isFormDataLike = (data: any): data is FormData =>
  typeof data?.append === 'function';

export const userApi = {
  updateMe: (data: object | FormData) =>
    isFormDataLike(data)
      ? multipartFetch('PATCH', '/users/me', data)
      : api.patch('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/me/password', data),
};

export const groupApi = {
  create: (data: object) => api.post('/groups', data),
  list: () => api.get('/groups'),
  get: (id: string) => api.get(`/groups/${id}`),
  join: (inviteCode: string) => api.post('/groups/join', { inviteCode }),
  update: (id: string, data: object) => api.patch(`/groups/${id}`, data),
  leave: (id: string) => api.post(`/groups/${id}/leave`),
  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
  balances: (id: string) => api.get(`/groups/${id}/balances`),
  myBalance: (id: string) => api.get(`/groups/${id}/balances/me`),
};

export const expenseApi = {
  create: (formData: FormData) => multipartFetch('POST', '/expenses', formData),
  list: (groupId: string, params?: object) =>
    api.get('/expenses', { params: { groupId, ...params } }),
  get: (id: string, groupId: string) =>
    api.get(`/expenses/${id}`, { params: { groupId } }),
  update: (id: string, data: object) => api.patch(`/expenses/${id}`, data),
  delete: (id: string, groupId: string) =>
    api.delete(`/expenses/${id}`, { params: { groupId } }),
};

export const settlementApi = {
  create: (data: object) => api.post('/settlements', data),
  list: (groupId: string) =>
    api.get('/settlements', { params: { groupId } }),
  confirm: (id: string, groupId: string) =>
    api.patch(`/settlements/${id}/confirm`, { groupId }),
  reject: (id: string, groupId: string) =>
    api.patch(`/settlements/${id}/reject`, { groupId }),
};

export const reportApi = {
  monthly: (groupId: string, month: string) =>
    api.get('/reports/monthly', { params: { groupId, month } }),
  category: (groupId: string, from?: string, to?: string) =>
    api.get('/reports/category', { params: { groupId, from, to } }),
};

export const recurringApi = {
  list: (groupId: string) =>
    api.get('/recurring', { params: { groupId } }),
  create: (data: object) => api.post('/recurring', data),
  update: (id: string, data: object) => api.patch(`/recurring/${id}`, data),
  deactivate: (id: string, groupId: string) =>
    api.delete(`/recurring/${id}`, { params: { groupId } }),
};
