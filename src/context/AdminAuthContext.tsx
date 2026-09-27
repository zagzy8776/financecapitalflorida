import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getStoredAdminToken, setStoredAdminToken, clearStoredAdminToken } from '../lib/storageKeys';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  full_name: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const API = '/api';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = getStoredAdminToken();
    if (!token) { setAdmin(null); setLoading(false); return; }
    try {
      const res = await fetch(`${API}/admin/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Invalid session');
      const data = await res.json();
      setAdmin(data.user);
    } catch {
      clearStoredAdminToken();
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const onExpired = () => {
      setAdmin(null);
      setLoading(false);
    };
    window.addEventListener('finance-admin-auth-expired', onExpired);
    return () => window.removeEventListener('finance-admin-auth-expired', onExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin login failed');
    setStoredAdminToken(data.token);
    setAdmin(data.user);
  };

  const logout = () => {
    clearStoredAdminToken();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export function getAdminToken() {
  return getStoredAdminToken();
}