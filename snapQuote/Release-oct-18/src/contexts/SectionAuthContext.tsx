import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

type Section = 'dashboard' | 'payments' | 'analytics';

interface SectionAuthState {
  authenticated: boolean;
  studioId: string | null;
  loading: boolean;
  loginRequired: boolean;
  signIn: (username: string, password: string, studioId: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

function sessionKey(section: Section) {
  return `sq_${section}_token`;
}

function studioKey(section: Section) {
  return `sq_${section}_studio`;
}

const DashboardAuthContext = createContext<SectionAuthState | undefined>(undefined);
const PaymentsAuthContext = createContext<SectionAuthState | undefined>(undefined);
const AnalyticsAuthContext = createContext<SectionAuthState | undefined>(undefined);

function getCtx(section: Section) {
  if (section === 'dashboard') return DashboardAuthContext;
  if (section === 'payments') return PaymentsAuthContext;
  return AnalyticsAuthContext;
}

function useSectionAuthInternal(section: Section): SectionAuthState {
  const ctx = useContext(getCtx(section));
  if (!ctx) throw new Error(`useSectionAuth(${section}) must be used within its provider`);
  return ctx;
}

const ACCESS_COL: Record<Section, string> = {
  dashboard: 'dashboard_access_enabled',
  payments: 'payments_access_enabled',
  analytics: 'analytics_access_enabled',
};

interface AccessCacheEntry {
  access: Record<string, boolean>;
  promise: Promise<Record<string, boolean>> | null;
}

const accessCache = new Map<string, AccessCacheEntry>();

async function fetchAccessColumns(studioId: string): Promise<Record<string, boolean>> {
  const entry = accessCache.get(studioId);
  if (entry && entry.promise) return entry.promise;
  if (entry && !entry.promise) return entry.access;

  const promise = (async () => {
    try {
      const { data } = await supabase
        .from('studios')
        .select('dashboard_access_enabled, payments_access_enabled, analytics_access_enabled')
        .eq('id', studioId)
        .maybeSingle();

      const access: Record<string, boolean> = {
        dashboard_access_enabled: !!(data && data.dashboard_access_enabled === true),
        payments_access_enabled: !!(data && data.payments_access_enabled === true),
        analytics_access_enabled: !!(data && data.analytics_access_enabled === true),
      };
      const cacheEntry = accessCache.get(studioId);
      if (cacheEntry) {
        cacheEntry.access = access;
        cacheEntry.promise = null;
      }
      return access;
    } catch {
      const cacheEntry = accessCache.get(studioId);
      if (cacheEntry) {
        cacheEntry.promise = null;
      }
      return {};
    }
  })();

  accessCache.set(studioId, { access: {}, promise });
  return promise;
}

function SectionAuthProvider({ section, children }: { section: Section; children: ReactNode }) {
  const { profile } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);
  const tokenCheckedRef = useRef(false);

  const checkAccessAndRestore = useCallback(async (sid: string) => {
    setLoading(true);
    setAuthenticated(false);
    setLoginRequired(false);
    tokenCheckedRef.current = false;
    try {
      const access = await fetchAccessColumns(sid);
      const requiresLogin = !!access[ACCESS_COL[section]];

      setLoginRequired(requiresLogin);

      if (!requiresLogin) {
        setAuthenticated(true);
        setStudioId(sid);
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem(sessionKey(section));
      if (token) {
        try {
          const res = await fetch(`${SUPABASE_URL}/functions/v1/section-verify-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ANON_KEY}`,
              'Apikey': ANON_KEY,
            },
            body: JSON.stringify({ token, section }),
          });
          const resData = await res.json();
          if (resData.valid) {
            setAuthenticated(true);
            setStudioId(resData.studio_id);
          } else {
            sessionStorage.removeItem(sessionKey(section));
            sessionStorage.removeItem(studioKey(section));
            setAuthenticated(false);
            setStudioId(null);
          }
        } catch {
          sessionStorage.removeItem(sessionKey(section));
          sessionStorage.removeItem(studioKey(section));
          setAuthenticated(false);
          setStudioId(null);
        }
      } else {
        setAuthenticated(false);
        setStudioId(null);
      }
    } catch {
      setLoginRequired(false);
      setAuthenticated(true);
      setStudioId(sid);
    }
    tokenCheckedRef.current = true;
    setLoading(false);
  }, [section]);

  useEffect(() => {
    const sid = profile?.studio_id;
    if (sid) {
      checkAccessAndRestore(sid);
    } else {
      setAuthenticated(false);
      setLoginRequired(false);
      setStudioId(null);
      setLoading(false);
    }
  }, [profile?.studio_id, checkAccessAndRestore]);

  const signIn = useCallback(async (username: string, password: string, sid: string) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/section-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'Apikey': ANON_KEY,
        },
        body: JSON.stringify({ action: 'login', section, username, password, studio_id: sid }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { error: data.error ?? 'Login failed. Please try again.' };
      }
      sessionStorage.setItem(sessionKey(section), data.token);
      sessionStorage.setItem(studioKey(section), sid);
      setAuthenticated(true);
      setStudioId(sid);
      return { error: null };
    } catch {
      return { error: 'Network error. Please check your connection and try again.' };
    }
  }, [section]);

  const signOut = useCallback(async () => {
    if (!loginRequired) return;
    const token = sessionStorage.getItem(sessionKey(section));
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/section-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`,
            'Apikey': ANON_KEY,
          },
          body: JSON.stringify({ action: 'logout', token }),
        });
      } catch { /* best effort */ }
    }
    sessionStorage.removeItem(sessionKey(section));
    sessionStorage.removeItem(studioKey(section));
    setAuthenticated(false);
    setStudioId(null);
  }, [section, loginRequired]);

  const value: SectionAuthState = { authenticated, studioId, loading, loginRequired, signIn, signOut };

  const Ctx = getCtx(section);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  return <SectionAuthProvider section="dashboard">{children}</SectionAuthProvider>;
}

export function PaymentsAuthProvider({ children }: { children: ReactNode }) {
  return <SectionAuthProvider section="payments">{children}</SectionAuthProvider>;
}

export function AnalyticsAuthProvider({ children }: { children: ReactNode }) {
  return <SectionAuthProvider section="analytics">{children}</SectionAuthProvider>;
}

export function useSectionAuth(section: Section) {
  return useSectionAuthInternal(section);
}

export function getSectionToken(section: Section) {
  return sessionStorage.getItem(sessionKey(section));
}

export function getSectionStudioId(section: Section) {
  return sessionStorage.getItem(studioKey(section));
}
