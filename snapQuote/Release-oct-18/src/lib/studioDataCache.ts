import { supabase } from '../lib/supabase';
import { Client, Service, Package as PkgType } from '../types';

interface StudioDataCache {
  clients: Client[];
  services: Service[];
  packages: PkgType[];
  studio: Record<string, any> | null;
  portfolioImages: { id: string; url: string; caption: string | null; sort_order: number }[];
  promise: Promise<StudioDataCache> | null;
  listeners: Set<(data: StudioDataCache) => void>;
}

const cache = new Map<string, StudioDataCache>();

export function getStudioData(studioId: string): StudioDataCache | null {
  return cache.get(studioId) ?? null;
}

export function invalidateStudioData(studioId: string, table?: 'clients' | 'services' | 'packages' | 'studio' | 'portfolio') {
  const entry = cache.get(studioId);
  if (!entry) return;
  if (table) {
    // Partial invalidation — just refetch that one table
    refreshSingleTable(studioId, table);
  } else {
    cache.delete(studioId);
  }
}

async function refreshSingleTable(studioId: string, table: string) {
  const entry = cache.get(studioId);
  if (!entry) return;
  try {
    if (table === 'clients') {
      const { data } = await supabase.from('clients').select('*').eq('studio_id', studioId).order('created_at', { ascending: false });
      entry.clients = data as Client[] ?? [];
    } else if (table === 'services') {
      const { data } = await supabase.from('services').select('*').eq('studio_id', studioId).eq('is_active', true).order('name');
      entry.services = data as Service[] ?? [];
    } else if (table === 'packages') {
      const { data } = await supabase.from('packages').select('*').eq('studio_id', studioId).eq('is_active', true).order('name');
      entry.packages = data as PkgType[] ?? [];
    } else if (table === 'studio') {
      const { data } = await supabase.from('studios').select('*').eq('id', studioId).maybeSingle();
      entry.studio = data;
    } else if (table === 'portfolio') {
      const { data } = await supabase.from('studio_portfolio_images').select('id, url, caption, sort_order').eq('studio_id', studioId).order('sort_order', { ascending: true });
      entry.portfolioImages = data ?? [];
    }
    entry.listeners.forEach(fn => fn(entry));
  } catch {}
}

export async function fetchStudioData(studioId: string): Promise<StudioDataCache> {
  const existing = cache.get(studioId);
  if (existing) {
    if (existing.promise) return existing.promise;
    return existing;
  }

  const entry: StudioDataCache = {
    clients: [],
    services: [],
    packages: [],
    studio: null,
    portfolioImages: [],
    promise: null,
    listeners: new Set(),
  };
  cache.set(studioId, entry);

  entry.promise = (async () => {
    const [clientsRes, servicesRes, packagesRes, studioRes, portfolioRes] = await Promise.all([
      supabase.from('clients').select('*').eq('studio_id', studioId).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('studio_id', studioId).eq('is_active', true).order('name'),
      supabase.from('packages').select('*').eq('studio_id', studioId).eq('is_active', true).order('name'),
      supabase.from('studios').select('*').eq('id', studioId).maybeSingle(),
      supabase.from('studio_portfolio_images').select('id, url, caption, sort_order').eq('studio_id', studioId).order('sort_order', { ascending: true }),
    ]);

    entry.clients = clientsRes.data as Client[] ?? [];
    entry.services = servicesRes.data as Service[] ?? [];
    entry.packages = packagesRes.data as PkgType[] ?? [];
    entry.studio = studioRes.data;
    entry.portfolioImages = portfolioRes.data ?? [];
    entry.promise = null;
    entry.listeners.forEach(fn => fn(entry));
    return entry;
  })();

  return entry.promise;
}

export function subscribeToStudioData(studioId: string, cb: (data: StudioDataCache) => void): () => void {
  const entry = cache.get(studioId);
  if (!entry) return () => {};
  entry.listeners.add(cb);
  return () => { entry.listeners.delete(cb); };
}
