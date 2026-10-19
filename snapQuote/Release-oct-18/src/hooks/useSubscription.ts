import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { StudioQuota, PLAN_LIMITS, PLAN_LABELS, isFreePlan, isBusinessPlan } from '../types';

interface UseSubscriptionReturn {
  quota: StudioQuota | null;
  loading: boolean;
  refresh: () => Promise<void>;
  planLabel: string;
  usagePercent: number;
  usageText: string;
  isBlocked: boolean;
  isTrial: boolean;
  isTrialExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number | null;
}

interface QuotaCacheEntry {
  quota: StudioQuota | null;
  loading: boolean;
  promise: Promise<void> | null;
  listeners: Set<(quota: StudioQuota | null, loading: boolean) => void>;
}

const quotaCache = new Map<string, QuotaCacheEntry>();

function getCacheEntry(studioId: string): QuotaCacheEntry {
  let entry = quotaCache.get(studioId);
  if (!entry) {
    entry = { quota: null, loading: true, promise: null, listeners: new Set() };
    quotaCache.set(studioId, entry);
  }
  return entry;
}

async function fetchQuotaForStudio(studioId: string) {
  const entry = getCacheEntry(studioId);
  if (entry.promise) return entry.promise;
  if (!entry.loading && entry.quota !== null) return;

  entry.loading = true;
  entry.listeners.forEach(fn => fn(entry.quota, true));

  entry.promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('studio_quota')
        .select('studio_id, plan, is_active, status, subscription_expires_at, quotes_this_month, quotes_reset_at, monthly_limit, limit_reached, near_limit')
        .eq('studio_id', studioId)
        .maybeSingle();

      if (error) throw error;
      entry.quota = data as StudioQuota | null;
    } catch {
      entry.quota = null;
    } finally {
      entry.loading = false;
      entry.promise = null;
      entry.listeners.forEach(fn => fn(entry.quota, false));
    }
  })();

  return entry.promise;
}

export function useSubscription(studioId: string | null | undefined): UseSubscriptionReturn {
  const [quota, setQuota] = useState<StudioQuota | null>(() => {
    if (!studioId) return null;
    return getCacheEntry(studioId).quota;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!studioId) return false;
    return getCacheEntry(studioId).loading;
  });

  useEffect(() => {
    if (!studioId) {
      setQuota(null);
      setLoading(false);
      return;
    }

    const entry = getCacheEntry(studioId);
    setQuota(entry.quota);
    setLoading(entry.loading);

    const listener = (newQuota: StudioQuota | null, newLoading: boolean) => {
      setQuota(newQuota);
      setLoading(newLoading);
    };
    entry.listeners.add(listener);

    if (entry.loading || entry.quota === null) {
      fetchQuotaForStudio(studioId);
    }

    return () => {
      entry.listeners.delete(listener);
    };
  }, [studioId]);

  const refresh = useCallback(async () => {
    if (!studioId) return;
    const entry = getCacheEntry(studioId);
    entry.quota = null;
    entry.loading = true;
    entry.listeners.forEach(fn => fn(entry.quota, true));
    await fetchQuotaForStudio(studioId);
  }, [studioId]);

  const plan = quota?.plan ?? 'trial';
  const planLabel = PLAN_LABELS[plan] ?? 'Free';
  const limit = quota?.monthly_limit ?? PLAN_LIMITS[plan];
  const used = quota?.quotes_this_month ?? 0;

  const usagePercent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const isFree = isFreePlan(plan);
  const isBusiness = isBusinessPlan(plan);

  const usageText = isFree
    ? `Free: ${used} / ${limit} quotes used`
    : limit
      ? `${used} / ${limit} quotes used`
      : `${used} quotes used`;

  const isTrialExpired = isFree && (quota?.limit_reached ?? false);

  const daysUntilExpiry = (() => {
    if (!quota?.subscription_expires_at || isFree) return null;
    const diff = new Date(quota.subscription_expires_at).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7;

  const isBlocked =
    !loading &&
    quota !== null &&
    (!quota.is_active ||
      quota.status === 'suspended' ||
      quota.limit_reached ||
      (quota.subscription_expires_at !== null &&
        new Date(quota.subscription_expires_at) < new Date()));

  return {
    quota,
    loading,
    refresh,
    planLabel,
    usagePercent,
    usageText,
    isBlocked,
    isTrial: isFree,
    isTrialExpired,
    isExpiringSoon,
    daysUntilExpiry,
  };
}
