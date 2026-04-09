import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spentro-jet.vercel.app/api/v1';

export const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  analytics: () =>
    api.get('/admin/analytics').then((r) => r.data),

  users: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/admin/users', { params }).then((r) => r.data),

  updateUserStatus: (id: string, status: 'active' | 'suspended') =>
    api.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data),

  groups: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/groups', { params }).then((r) => r.data),

  groupDetail: (id: string) =>
    api.get(`/admin/groups/${id}`).then((r) => r.data),

  auditLogs: (params?: { groupId?: string; userId?: string; action?: string; page?: number; limit?: number }) =>
    api.get('/admin/audit-logs', { params }).then((r) => r.data),
};
