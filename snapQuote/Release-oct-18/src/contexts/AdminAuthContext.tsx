import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AdminUser {
  id: string;
  username: string;
  full_name: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SESSION_KEY = 'sq_admin_session';

async function callFunction(name: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status >= 500) {
    const text = await res.text();
    throw new Error(`Edge function error (${res.status}): ${text}`);
  }
  return res.json();
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    verifyToken(token).finally(() => setLoading(false));
  }, []);

  async function verifyToken(token: string) {
    try {
      const data = await callFunction('admin-verify-session', { token });
      if (data.valid && data.admin) {
        setAdmin(data.admin);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        setAdmin(null);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      setAdmin(null);
    }
  }

  async function signIn(username: string, password: string): Promise<{ error: string | null }> {
    try {
      const data = await callFunction('admin-login', { username, password });
      if (data.error) {
        return { error: data.error };
      }
      sessionStorage.setItem(SESSION_KEY, data.token);
      setAdmin(data.admin);
      return { error: null };
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  }

  async function signOut(): Promise<void> {
    const token = sessionStorage.getItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setAdmin(null);
    if (token) {
      try {
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('token', token);
      } catch {
        // best effort
      }
    }
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
