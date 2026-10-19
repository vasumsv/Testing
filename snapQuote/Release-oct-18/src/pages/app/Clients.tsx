import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Users, Phone, Mail, Lock, ArrowUpCircle,
  MessageCircle, ChevronRight, X, FileText,
  CheckCircle2, XCircle, AlertCircle, Send, Clock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { quoteStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { invalidateStudioData } from '../../lib/studioDataCache';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { Client, Quote, isBusinessPlan } from '../../types';

interface ClientWithLatest extends Client {
  latest_quote_number: string | null;
  latest_quote_status: string | null;
  latest_quote_date: string | null;
  latest_quote_id: string | null;
  latest_quote_pdf_url: string | null;
  quote_count: number;
}

type FollowupResult = 'sending' | 'sent' | 'failed' | 'limit_reached' | 'no_quote' | 'no_config';

function responseBadge(response: string | null): React.ReactNode {
  if (!response) return <span className="text-ink-subtle text-xs">—</span>;
  const map: Record<string, { label: string; className: string }> = {
    awaiting_response: { label: 'Awaiting', className: 'bg-slate-50 text-slate-600 border border-slate-200' },
    interested: { label: 'Interested', className: 'bg-green-50 text-green-700 border border-green-200' },
    wants_to_discuss: { label: 'Discuss', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    not_interested: { label: 'Not Interested', className: 'bg-red-50 text-red-700 border border-red-200' },
  };
  const r = map[response];
  if (!r) return <span className="text-ink-subtle text-xs">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.className}`}>
      {r.label}
    </span>
  );
}

export function Clients() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { quota } = useSubscription(profile?.studio_id);
  const plan = quota?.plan ?? 'trial';
  const hasAccess = isBusinessPlan(plan);

  const [clients, setClients] = useState<ClientWithLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailClient, setDetailClient] = useState<{ client: ClientWithLatest; quotes: Quote[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studioName, setStudioName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [waSending, setWaSending] = useState(false);
  const [waToast, setWaToast] = useState<{ status: 'sent' | 'failed' | 'not_configured' | 'no_quote' } | null>(null);

  const [followupConfirm, setFollowupConfirm] = useState<ClientWithLatest | null>(null);
  const [followupSending, setFollowupSending] = useState(false);
  const [followupToast, setFollowupToast] = useState<{ status: FollowupResult; message?: string } | null>(null);

  useEffect(() => {
    if (profile?.studio_id) {
      fetchClients();
      supabase.from('studios').select('name').eq('id', profile.studio_id).maybeSingle().then(({ data }) => {
        if (data?.name) setStudioName(data.name);
      });
    } else {
      setLoading(false);
    }
  }, [profile?.studio_id]);

  async function fetchClients() {
    setLoading(true);
    const studioId = profile!.studio_id;

    const [clientsRes, quotesRes] = await Promise.all([
      supabase.from('clients').select('id, studio_id, full_name, phone, email, event_type, notes, created_at, updated_at, followup_count, last_followup_at, last_followup_result, client_response, client_response_at, client_response_quote_id').eq('studio_id', studioId).order('created_at', { ascending: false }),
      supabase.from('quotes').select('id, client_id, quote_number, status, amount, created_at, deleted_at, pdf_url').eq('studio_id', studioId).is('deleted_at', null).order('created_at', { ascending: false }),
    ]);

    const clientList: ClientWithLatest[] = (clientsRes.data ?? []).map((c: Client) => {
      const clientQuotes = (quotesRes.data ?? []).filter((q: any) => q.client_id === c.id);
      const latest = clientQuotes[0];
      return {
        ...c,
        latest_quote_number: latest?.quote_number ?? null,
        latest_quote_status: latest?.status ?? null,
        latest_quote_date: latest?.created_at ?? null,
        latest_quote_id: latest?.id ?? null,
        latest_quote_pdf_url: latest?.pdf_url ?? null,
        quote_count: clientQuotes.length,
      };
    });

    setClients(clientList);
    setLoading(false);
  }

  async function openDetail(client: ClientWithLatest) {
    setDetailLoading(true);
    setDetailClient({ client, quotes: [] });
    const { data } = await supabase
      .from('quotes')
      .select('id, quote_number, client_name, client_email, client_phone, amount, status, valid_until, notes, theme_id, show_discount, final_price, items, quote_options, follow_up_sent_at, whatsapp_sent_at, pdf_url, deleted_at, created_at, updated_at, client_id, lead_id, studio_id')
      .eq('studio_id', profile!.studio_id)
      .eq('client_id', client.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setDetailClient({ client, quotes: (data as Quote[]) ?? [] });
    setDetailLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const phone = form.phone.trim();
      if (phone) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('studio_id', profile!.studio_id)
          .eq('phone', phone)
          .maybeSingle();
        if (existing) {
          setSaveError('A client with this phone number already exists.');
          setSaving(false);
          return;
        }
      }
      const { error } = await supabase.from('clients').insert({
        studio_id: profile!.studio_id,
        full_name: form.full_name.trim(),
        phone,
        email: form.email.trim(),
      });
      if (error) throw error;
      setForm({ full_name: '', phone: '', email: '' });
      setAddOpen(false);
      invalidateStudioData(profile!.studio_id, 'clients');
      await fetchClients();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save client.');
    } finally {
      setSaving(false);
    }
  }

  async function sendClientWhatsApp() {
    if (!detailClient || !profile?.studio_id) return;
    const phone = detailClient.client.phone;
    if (!phone) return;
    const latestQuote = detailClient.quotes[0];
    if (!latestQuote) {
      setWaToast({ status: 'no_quote' });
      setTimeout(() => setWaToast(null), 5000);
      return;
    }
    setWaSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const pdfUrl = (latestQuote as any).pdf_url ?? null;
      const res = await fetch(`${supabaseUrl}/functions/v1/interakt-send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studio_id: profile.studio_id,
          quote_id: latestQuote.id,
          client_id: detailClient.client.id,
          message_type: 'quote_sent',
          phone,
          pdf_url: pdfUrl,
          body_values: [
            detailClient.client.full_name,
            studioName || 'our studio',
          ],
        }),
      });
      let json: any = {};
      try { json = await res.json(); } catch { /**/ }
      if (json.configured === false) {
        setWaToast({ status: 'not_configured' });
      } else if (json.success === true) {
        setWaToast({ status: 'sent' });
      } else {
        setWaToast({ status: 'failed' });
      }
      setTimeout(() => setWaToast(null), 5000);
    } catch {
      setWaToast({ status: 'failed' });
      setTimeout(() => setWaToast(null), 5000);
    } finally {
      setWaSending(false);
    }
  }

  async function sendFollowup() {
    if (!followupConfirm || !profile?.studio_id) return;
    const client = followupConfirm;

    if (!client.phone) {
      setFollowupToast({ status: 'no_quote', message: 'No phone number for this client.' });
      setTimeout(() => setFollowupToast(null), 5000);
      return;
    }
    if (!client.latest_quote_id) {
      setFollowupToast({ status: 'no_quote', message: 'No quotation found. Create a quote first.' });
      setTimeout(() => setFollowupToast(null), 5000);
      return;
    }
    if ((client.followup_count ?? 0) >= 3) {
      setFollowupToast({ status: 'limit_reached', message: 'Maximum 3 follow-ups have been sent.' });
      setTimeout(() => setFollowupToast(null), 5000);
      return;
    }

    setFollowupSending(true);
    setFollowupToast(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const nextFollowupNumber = (client.followup_count ?? 0) + 1;

      const res = await fetch(`${supabaseUrl}/functions/v1/interakt-send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studio_id: profile.studio_id,
          quote_id: client.latest_quote_id,
          client_id: client.id,
          message_type: 'follow_up',
          phone: client.phone,
          pdf_url: client.latest_quote_pdf_url,
          followup_number: nextFollowupNumber,
          body_values: [
            client.full_name,
            studioName || 'our studio',
          ],
        }),
      });

      let json: any = {};
      try { json = await res.json(); } catch { /**/ }

      if (json.configured === false) {
        setFollowupToast({ status: 'no_config', message: 'WhatsApp is not configured. Please contact SnapQuote support.' });
      } else if (json.success === true) {
        setFollowupToast({ status: 'sent', message: `Follow-up ${nextFollowupNumber}/3 sent successfully.` });
        await fetchClients();
        if (detailClient?.client.id === client.id) {
          setDetailClient(prev => prev ? { ...prev, client: { ...prev.client, followup_count: nextFollowupNumber, last_followup_at: new Date().toISOString(), last_followup_result: 'success' } } : null);
        }
        setFollowupConfirm(null);
      } else if (json.limit_reached) {
        setFollowupToast({ status: 'limit_reached', message: 'Maximum 3 follow-ups have been sent to this client.' });
        await fetchClients();
        setFollowupConfirm(null);
      } else {
        setFollowupToast({ status: 'failed', message: json.error || 'WhatsApp follow-up could not be sent. Please try again.' });
      }
      setTimeout(() => setFollowupToast(null), 5000);
    } catch {
      setFollowupToast({ status: 'failed', message: 'Network error. Please try again.' });
      setTimeout(() => setFollowupToast(null), 5000);
    } finally {
      setFollowupSending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtDateTime(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function followupTooltip(c: ClientWithLatest): string {
    if (!c.phone) return 'No phone number for this client';
    if (!c.latest_quote_id) return 'No quotation found — create a quote first';
    if ((c.followup_count ?? 0) >= 3) return 'All 3 follow-ups have been sent';
    return 'Send WhatsApp follow-up';
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Lock className="w-7 h-7 text-slate-400" />
        </div>
        <div className="flex flex-col gap-2 max-w-sm">
          <h2 className="text-xl font-semibold text-ink">Clients — Business Feature</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Manage your client database, track quotation history per client, and contact them directly. Available on the SnapQuote Business plan.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Included in Business</p>
            {['Client Database', 'Quotation History', 'WhatsApp Follow-ups', 'Client Response Tracking', 'Package templates'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-ink">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                {f}
              </div>
            ))}
          </div>
          <a
            href="/app/settings?tab=billing"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Upgrade to Business — ₹699/mo
          </a>
          <p className="text-xs text-ink-subtle">Cancel anytime. No commitment required.</p>
        </div>
      </div>
    );
  }

  const toastStyles: Record<string, { bg: string; iconColor: string; textColor: string }> = {
    sent: { bg: 'bg-green-50 border-green-200', iconColor: 'text-green-600', textColor: 'text-green-700' },
    failed: { bg: 'bg-red-50 border-red-200', iconColor: 'text-red-600', textColor: 'text-red-700' },
    limit_reached: { bg: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
    no_config: { bg: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
    no_quote: { bg: 'bg-amber-50 border-amber-200', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
    sending: { bg: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Clients</h2>
          <p className="text-sm sm:text-[0.9375rem] text-ink-muted mt-0.5">
            {clients.length} client{clients.length !== 1 ? 's' : ''} in your database
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAddOpen(true)}>
          <span className="hidden sm:inline">Add Client</span>
        </Button>
      </div>

      {/* Follow-up toast */}
      {followupToast && (
        <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 border ${toastStyles[followupToast.status].bg}`}>
          {followupToast.status === 'sent' && <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${toastStyles[followupToast.status].iconColor}`} />}
          {followupToast.status === 'failed' && <XCircle className={`w-4 h-4 shrink-0 mt-0.5 ${toastStyles[followupToast.status].iconColor}`} />}
          {(followupToast.status === 'limit_reached' || followupToast.status === 'no_config' || followupToast.status === 'no_quote') && <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${toastStyles[followupToast.status].iconColor}`} />}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${toastStyles[followupToast.status].textColor}`}>{followupToast.message}</p>
          </div>
          <button onClick={() => setFollowupToast(null)} className="shrink-0 text-ink-subtle hover:text-ink transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        clients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No clients yet"
            description="Clients are created automatically when you save quotes. You can also add them manually."
            action={{ label: 'Add Client', onClick: () => setAddOpen(true) }}
          />
        ) : (
          <EmptyState
            icon={<Search className="w-5 h-5" />}
            title="No results"
            description="No clients match your current search."
          />
        )
      ) : (
        <>
          {/* ─── Desktop / Tablet: scrollable table ─────────────────────────── */}
          <div className="hidden sm:block bg-surface border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-raised">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[200px] min-w-[180px]">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[130px] min-w-[110px]">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[110px] min-w-[100px] hidden md:table-cell">Quote</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[90px] min-w-[80px]">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[110px] min-w-[100px]">Response</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[110px] min-w-[100px] hidden lg:table-cell">Follow-ups</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[90px] min-w-[80px] hidden lg:table-cell">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-ink-subtle uppercase tracking-wide w-[120px] min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const maxFollowups = (c.followup_count ?? 0) >= 3;
                    const canFollowup = !!c.phone && !!c.latest_quote_id && !maxFollowups;
                    const disabledReason = !c.phone ? 'No phone number' : !c.latest_quote_id ? 'No quotation' : maxFollowups ? '3/3 sent' : '';
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openDetail(c)}
                        className="border-b border-border last:border-0 hover:bg-surface-hover/60 cursor-pointer transition-colors duration-150"
                      >
                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary-600">{c.full_name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-ink truncate max-w-[160px]">{c.full_name}</p>
                              {c.email && <p className="text-xs text-ink-subtle truncate max-w-[160px]">{c.email}</p>}
                            </div>
                          </div>
                        </td>
                        {/* Phone */}
                        <td className="px-4 py-3 text-ink-muted tabular-nums">{c.phone || '—'}</td>
                        {/* Latest Quote */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          {c.latest_quote_number ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/app/quote-builder/${c.latest_quote_id}`); }}
                              className="text-sm font-semibold text-primary-600 hover:underline font-mono whitespace-nowrap"
                            >
                              {c.latest_quote_number}
                            </button>
                          ) : (
                            <span className="text-ink-subtle">—</span>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          {c.latest_quote_status ? quoteStatusBadge(c.latest_quote_status) : <span className="text-ink-subtle">—</span>}
                        </td>
                        {/* Response */}
                        <td className="px-4 py-3">
                          {responseBadge(c.client_response)}
                        </td>
                        {/* Follow-ups */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-xs font-medium ${maxFollowups ? 'text-ink-muted' : 'text-ink-muted'}`}>
                              {c.followup_count ?? 0}/3 {maxFollowups ? 'sent' : (c.followup_count ?? 0) > 0 ? 'sent' : ''}
                            </span>
                            {c.last_followup_at && (
                              <span className="text-[10px] text-ink-subtle" title={fmtDateTime(c.last_followup_at)}>
                                {fmtDate(c.last_followup_at)}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Created */}
                        <td className="px-4 py-3 text-ink-muted hidden lg:table-cell whitespace-nowrap">{fmtDate(c.created_at)}</td>
                        {/* Actions */}
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end">
                            {canFollowup ? (
                              <button
                                onClick={() => setFollowupConfirm(c)}
                                disabled={followupSending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-white border border-green-300 hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                title="Send WhatsApp follow-up"
                              >
                                {followupSending ? (
                                  <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3" />
                                )}
                                Follow Up
                              </button>
                            ) : maxFollowups ? (
                              <span className="inline-flex items-center gap-1 text-xs text-ink-subtle whitespace-nowrap" title="All 3 follow-ups sent">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                3/3
                              </span>
                            ) : (
                              <span className="text-xs text-ink-subtle whitespace-nowrap" title={disabledReason}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Mobile: card layout ───────────────────────────────────────── */}
          <div className="sm:hidden space-y-3">
            {filtered.map(c => {
              const maxFollowups = (c.followup_count ?? 0) >= 3;
              const canFollowup = !!c.phone && !!c.latest_quote_id && !maxFollowups;
              const disabledReason = !c.phone ? 'No phone number' : !c.latest_quote_id ? 'No quotation' : maxFollowups ? '3/3 sent' : '';
              return (
                <div
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className="bg-surface border border-border rounded-xl shadow-card p-4 active:bg-surface-hover/50 cursor-pointer transition-colors"
                >
                  {/* Top row: avatar + name + actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary-600">{c.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink truncate">{c.full_name}</p>
                        {c.email && <p className="text-xs text-ink-subtle truncate">{c.email}</p>}
                      </div>
                    </div>
                    {canFollowup ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setFollowupConfirm(c); }}
                        disabled={followupSending}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-white border border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50 shrink-0"
                        title="Send WhatsApp follow-up"
                      >
                        {followupSending ? (
                          <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Follow Up
                      </button>
                    ) : maxFollowups ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-subtle shrink-0" title="All 3 follow-ups sent">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        3/3
                      </span>
                    ) : (
                      <span className="text-xs text-ink-subtle shrink-0" title={disabledReason}>—</span>
                    )}
                  </div>

                  {/* Info row */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {c.phone && (
                      <span className="text-xs text-ink-muted tabular-nums">{c.phone}</span>
                    )}
                    {c.latest_quote_number && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/quote-builder/${c.latest_quote_id}`); }}
                        className="text-xs font-semibold text-primary-600 font-mono hover:underline"
                      >
                        {c.latest_quote_number}
                      </button>
                    )}
                    {c.latest_quote_status && quoteStatusBadge(c.latest_quote_status)}
                    {responseBadge(c.client_response)}
                  </div>

                  {/* Bottom row: follow-up + created */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                    <span className="text-[10px] text-ink-subtle">
                      {c.followup_count ?? 0}/3 follow-ups{c.last_followup_at ? ` · ${fmtDate(c.last_followup_at)}` : ''}
                    </span>
                    <span className="text-[10px] text-ink-subtle">{fmtDate(c.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail Panel */}
      {detailClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setDetailClient(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-600">{detailClient.client.full_name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-ink truncate">{detailClient.client.full_name}</h3>
                  <p className="text-xs text-ink-subtle">{detailClient.quotes.length} quotation{detailClient.quotes.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {detailClient.client.phone && (
                  <>
                    <a
                      href={`tel:${detailClient.client.phone}`}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-ink-subtle hover:text-ink hover:bg-surface-raised transition-colors"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setFollowupConfirm(detailClient.client)}
                      disabled={followupSending || (detailClient.client.followup_count ?? 0) >= 3 || !detailClient.client.latest_quote_id}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-green-700 bg-white border border-green-300 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                      title={followupTooltip(detailClient.client)}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {(detailClient.client.followup_count ?? 0) >= 3 ? '3/3 Sent' : `Follow Up`}
                    </button>
                    <button
                      onClick={sendClientWhatsApp}
                      disabled={waSending}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                      title="Send latest quote via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                {detailClient.client.email && (
                  <a
                    href={`mailto:${detailClient.client.email}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-ink-subtle hover:text-ink hover:bg-surface-raised transition-colors"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setDetailClient(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-raised rounded-lg p-3">
                  <p className="text-xs text-ink-subtle mb-1">Phone</p>
                  <p className="text-sm font-medium text-ink">{detailClient.client.phone || '—'}</p>
                </div>
                <div className="bg-surface-raised rounded-lg p-3">
                  <p className="text-xs text-ink-subtle mb-1">Email</p>
                  <p className="text-sm font-medium text-ink truncate">{detailClient.client.email || '—'}</p>
                </div>
              </div>

              {/* Follow-up tracking */}
              <div className="bg-surface-raised rounded-lg p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-ink-subtle" />
                  <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wide">Follow-up Tracking</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-ink-subtle">Attempts</p>
                    <p className="text-sm font-medium text-ink">{detailClient.client.followup_count ?? 0}/3 sent</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-subtle">Last sent</p>
                    <p className="text-sm font-medium text-ink">{detailClient.client.last_followup_at ? fmtDate(detailClient.client.last_followup_at) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-subtle">Last result</p>
                    <p className="text-sm font-medium text-ink">
                      {detailClient.client.last_followup_result ? (
                        <span className={detailClient.client.last_followup_result === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {detailClient.client.last_followup_result === 'success' ? 'Success' : 'Failed'}
                        </span>
                      ) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client response */}
              {detailClient.client.client_response && (
                <div className="bg-surface-raised rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wide mb-1">Client Response</p>
                      {responseBadge(detailClient.client.client_response)}
                    </div>
                    {detailClient.client.client_response_at && (
                      <p className="text-xs text-ink-subtle">{fmtDateTime(detailClient.client.client_response_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {waToast && (
                <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 border mb-4 ${waToast.status === 'sent' ? 'bg-green-50 border-green-200' : waToast.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  {waToast.status === 'sent' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                  {waToast.status === 'failed' && <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  {(waToast.status === 'not_configured' || waToast.status === 'no_quote') && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    {waToast.status === 'sent' && <p className="text-sm text-green-700 font-medium">WhatsApp message sent with the latest quotation.</p>}
                    {waToast.status === 'failed' && <p className="text-sm text-red-700 font-medium">WhatsApp could not be sent. Please try again later.</p>}
                    {waToast.status === 'not_configured' && <p className="text-sm text-amber-700 font-medium">WhatsApp is not available. Please contact SnapQuote support.</p>}
                    {waToast.status === 'no_quote' && <p className="text-sm text-amber-700 font-medium">No quotation found for this client. Create a quote first.</p>}
                  </div>
                  <button onClick={() => setWaToast(null)} className="shrink-0 text-ink-subtle hover:text-ink transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}

              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : detailClient.quotes.length === 0 ? (
                <div className="text-center py-10 text-sm text-ink-subtle">
                  No quotations yet for this client.
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-ink-subtle uppercase tracking-wider mb-2">Quotation History</h4>
                  {detailClient.quotes.map(q => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/app/quote-builder/${q.id}`)}
                      className="flex items-center gap-3 bg-surface-raised border border-border rounded-lg p-3 hover:bg-primary-50/40 hover:border-primary-200 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-600 font-mono">{q.quote_number}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-ink-subtle">{formatCurrency(Number(q.amount))}</span>
                          <span className="text-ink-subtle">·</span>
                          <span className="text-xs text-ink-subtle">{fmtDate(q.created_at)}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {quoteStatusBadge(q.status)}
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-subtle shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Follow-up confirmation dialog */}
      {followupConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !followupSending && setFollowupConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-ink">Send Follow-up?</h3>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                  Send a WhatsApp follow-up to <span className="font-medium text-ink">{followupConfirm.full_name}</span> regarding quotation <span className="font-mono text-primary-600">{followupConfirm.latest_quote_number}</span>.
                </p>
                <div className="mt-3 bg-surface-raised rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-ink-subtle">Follow-up attempt</span>
                  <span className="text-sm font-semibold text-ink">{(followupConfirm.followup_count ?? 0) + 1} of 3</span>
                </div>
              </div>
              <button
                onClick={() => !followupSending && setFollowupConfirm(null)}
                className="ml-auto p-1 rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              <button
                onClick={sendFollowup}
                disabled={followupSending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {followupSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Follow-up
                  </>
                )}
              </button>
              <button
                onClick={() => !followupSending && setFollowupConfirm(null)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setSaveError(null); }}
        title="Add Client"
        description="Add a client to your database manually."
        width="sm"
      >
        <form onSubmit={handleAdd}>
          <div className="space-y-3">
            <Input
              label="Full Name"
              placeholder="e.g. Sarah Johnson"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              required
              autoFocus
            />
            <PhoneInput
              label="Phone"
              placeholder="555 0100"
              value={form.phone}
              onChange={phone => setForm(p => ({ ...p, phone }))}
            />
            <Input
              label="Email"
              type="email"
              placeholder="client@email.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              prefix={<Mail className="w-3.5 h-3.5" />}
            />
            {saveError && (
              <p className="text-xs text-danger bg-red-50 border border-red-100 rounded-md px-3 py-2">{saveError}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={saving}>
              Add Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
