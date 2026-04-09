export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const saveAuth = (token: string, user: AdminUser) => {
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

export const getUser = (): AdminUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('adminUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => !!getToken();
