import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, FileText, Clock, Pencil, Lock, Eye, X,
  SquarePen, CheckCircle2, XCircle, AlertCircle, Receipt,
  MessageCircle, Flame, ArrowRight, ExternalLink, Copy, Trash2,
  ChevronDown, ChevronUp, ChevronsUpDown, Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

import { quoteStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { Quote, QuoteStatus, Studio } from '../../types';
import { useNavigate } from 'react-router-dom';
import { QuoteDocument } from './quote-builder/QuoteDocument';
import { QuoteActionsMenu } from './quote-builder/QuoteActionsMenu';
import { LineItem, SelectedLead, StudioInfo, QuoteOptions } from './quote-builder/types';

const HOT_STATUSES = new Set<QuoteStatus>(['interested']);

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: QuoteStatus; label: string; description: string }[] = [
  { value: 'draft', label: 'Draft', description: 'Quote is being prepared' },
  { value: 'sent', label: 'Sent', description: 'Quote delivered to client' },
  { value: 'follow_up_pending', label: 'Follow-up Pending', description: 'Awaiting client response' },
  { value: 'interested', label: 'Interested', description: 'Client expressed interest' },
  { value: 'accepted', label: 'Accepted', description: 'Client accepted the quote' },
  { value: 'invoice_created', label: 'Invoice Created', description: 'Invoice generated for this quote' },
  { value: 'paid', label: 'Paid', description: 'Payment received in full' },
  { value: 'rejected', label: 'Rejected', description: 'Client declined the quote' },
  { value: 'expired', label: 'Expired', description: 'Quote validity has lapsed' },
];

const STATUS_COLORS: Record<QuoteStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700 border border-blue-100',
  follow_up_pending: 'bg-amber-50 text-amber-700 border border-amber-100',
  interested: 'bg-green-50 text-green-700 border border-green-100',
  accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  invoice_created: 'bg-sky-50 text-sky-700 border border-sky-100',
  paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-100',
  expired: 'bg-amber-50 text-amber-600 border border-amber-100',
};

const INVOICE_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  unpaid: { label: 'Invoice · Unpaid', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  partial: { label: 'Invoice · Partial', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Invoice · Paid', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

type SortField = 'quote_number' | 'client_name' | 'amount' | 'created_at' | 'valid_until';
type SortDir = 'asc' | 'desc';

const FILTER_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'follow_up_pending', label: 'Follow-up' },
  { value: 'interested', label: 'Interested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'invoice_created', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Quotes() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { quota, isTrialExpired } = useSubscription(profile?.studio_id);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const limitReached = quota?.limit_reached ?? false;

  const [statusModal, setStatusModal] = useState<Quote | null>(null);
  const [newStatus, setNewStatus] = useState<QuoteStatus>('draft');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [invoiceModal, setInvoiceModal] = useState<Quote | null>(null);
  const [invoiceGstRate, setInvoiceGstRate] = useState('0');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceMap, setInvoiceMap] = useState<Map<string, { id: string; status: string }>>(new Map());

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteInvoiceToo, setDeleteInvoiceToo] = useState(false);

  const [portfolioImages, setPortfolioImages] = useState<{ id: string; url: string; caption: string; sort_order: number }[]>([]);
  const [waToast, setWaToast] = useState<{ quoteId: string; status: 'sent' | 'failed' | 'not_configured' | 'no_phone' } | null>(null);
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.studio_id && !studio) {
      Promise.all([
        supabase.from('studios').select('id, name, email, phone, address, website, gst_number, owner_name, logo_url, details_section, terms_and_conditions').eq('id', profile.studio_id).maybeSingle(),
        supabase.from('studio_portfolio_images').select('id, url, caption, sort_order').eq('studio_id', profile.studio_id).order('sort_order', { ascending: true }),
      ]).then(([{ data: studioData }, { data: imgData }]) => {
        if (studioData) setStudio(studioData);
        setPortfolioImages(imgData ?? []);
      });
    }
  }, [profile?.studio_id]);

  function buildStudioInfo(s: Studio | null): StudioInfo {
    return {
      name: s?.name ?? '',
      email: s?.email ?? '',
      phone: s?.phone ?? '',
      address: s?.address ?? '',
      website: s?.website ?? '',
      gst_number: s?.gst_number ?? '',
      owner_name: s?.owner_name ?? '',
      logo_url: s?.logo_url ?? '',
      portfolio_images: portfolioImages,
      details_section: (s as any)?.details_section ?? '',
      terms_and_conditions: (s as any)?.terms_and_conditions ?? '',
    };
  }

  function buildLead(q: Quote): SelectedLead | null {
    if (!q.client_name) return null;
    return {
      id: q.lead_id ?? '',
      full_name: q.client_name,
      phone: (q as any).client_phone ?? '',
      email: q.client_email ?? '',
      event_type: '',
      event_date: null,
    };
  }

  function getItems(q: Quote): LineItem[] {
    const raw = (q as any).items;
    if (!Array.isArray(raw)) return [];
    return raw;
  }

  useEffect(() => {
    if (profile?.studio_id) fetchQuotes();
    else setLoading(false);
  }, [profile?.studio_id]);

  async function fetchQuotes() {
    setLoading(true);
    const [{ data: qData }, { data: invData }] = await Promise.all([
      supabase.from('quotes').select('id, studio_id, lead_id, client_id, quote_number, client_name, client_email, client_phone, amount, status, valid_until, notes, theme_id, show_discount, final_price, quote_options, follow_up_sent_at, whatsapp_sent_at, pdf_url, deleted_at, created_at, updated_at').eq('studio_id', profile!.studio_id).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('invoices').select('id, quote_id, status').eq('studio_id', profile!.studio_id),
    ]);
    setQuotes(qData ?? []);
    const map = new Map<string, { id: string; status: string }>();
    for (const i of invData ?? []) map.set(i.quote_id, { id: i.id, status: i.status });
    setInvoiceMap(map);
    setLoading(false);
  }

  // ── Sort helper ──────────────────────────────────────────────────────────────
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-ink-subtle/50 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary-600 ml-1 inline" />
      : <ChevronDown className="w-3 h-3 text-primary-600 ml-1 inline" />;
  }

  // ── Filtering & sorting ───────────────────────────────────────────────────────
  const filtered = quotes
    .filter(q => {
      const s = search.toLowerCase();
      const matchSearch = !s ||
        q.client_name.toLowerCase().includes(s) ||
        q.quote_number.toLowerCase().includes(s) ||
        (q.client_email ?? '').toLowerCase().includes(s) ||
        ((q as any).client_phone ?? '').toLowerCase().includes(s) ||
        ((q as any).event_type ?? '').toLowerCase().includes(s);
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'amount') {
        cmp = Number(a.amount) - Number(b.amount);
      } else if (sortField === 'created_at' || sortField === 'valid_until') {
        const av = a[sortField] ?? '';
        const bv = b[sortField] ?? '';
        cmp = av < bv ? -1 : av > bv ? 1 : 0;
      } else {
        const av = String((a as any)[sortField] ?? '').toLowerCase();
        const bv = String((b as any)[sortField] ?? '').toLowerCase();
        cmp = av < bv ? -1 : av > bv ? 1 : 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // ── Stats ────────────────────────────────────────────────────────────────────

  const hotLeads = quotes.filter(q => HOT_STATUSES.has(q.status));

  function fmtDate(d: string | null | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const canGenerateInvoice = (q: Quote) => q.status === 'accepted' || q.status === 'interested';

  // ── Duplicate quote ───────────────────────────────────────────────────────────
  async function handleDuplicate(q: Quote) {
    if (!profile?.studio_id) return;
    const n = Math.floor(1000 + Math.random() * 9000);
    const newNumber = `QT-${n}`;
    const { data, error } = await supabase.from('quotes').insert({
      studio_id: profile.studio_id,
      lead_id: q.lead_id,
      quote_number: newNumber,
      client_name: q.client_name,
      client_email: q.client_email,
      client_phone: (q as any).client_phone,
      amount: q.amount,
      status: 'draft',
      valid_until: q.valid_until,
      notes: q.notes,
      items: (q as any).items,
      theme_id: (q as any).theme_id,
      quote_options: (q as any).quote_options,
      show_discount: (q as any).show_discount,
    }).select().maybeSingle();
    if (!error && data) {
      setQuotes(prev => [data, ...prev]);
      navigate(`/app/quote-builder/${data.id}`);
    }
  }

  // ── Delete quote ──────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteInvoiceToo && invoiceMap.has(deleteTarget.id)) {
        const invId = invoiceMap.get(deleteTarget.id)!.id;
        await supabase.from('invoices').delete().eq('id', invId);
      }
      // Soft delete
      const { error } = await supabase
        .from('quotes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setQuotes(prev => prev.filter(q => q.id !== deleteTarget.id));
      if (deleteInvoiceToo) {
        setInvoiceMap(prev => { const next = new Map(prev); next.delete(deleteTarget.id); return next; });
      }
      setDeleteTarget(null);
      setDeleteInvoiceToo(false);
    } catch {
      // keep modal open on failure
    } finally {
      setDeleting(false);
    }
  }

  // ── Invoice generation ────────────────────────────────────────────────────────
  async function handleGenerateInvoice() {
    if (!invoiceModal || !profile?.studio_id) return;
    setInvoiceError('');
    setGeneratingInvoice(true);

    const gstRate = parseFloat(invoiceGstRate) || 0;
    const subtotal = Number(invoiceModal.amount);
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    const total = subtotal + gstAmount;

    const { data: invNumbers } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('studio_id', profile.studio_id);
    const maxNum = (invNumbers ?? []).reduce((max, row) => {
      const n = parseInt(row.invoice_number.replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const invoiceNumber = `INV-${String(maxNum + 1).padStart(4, '0')}`;
    const items = (invoiceModal as any).items ?? [];

    const { data: inv, error } = await supabase.from('invoices').insert({
      studio_id: profile.studio_id,
      quote_id: invoiceModal.id,
      invoice_number: invoiceNumber,
      client_name: invoiceModal.client_name,
      client_email: invoiceModal.client_email ?? '',
      client_phone: (invoiceModal as any).client_phone ?? '',
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: invoiceDueDate || null,
      subtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
      notes: invoiceNotes.trim(),
      status: 'unpaid',
      items,
    }).select('id').maybeSingle();

    if (error || !inv) {
      setInvoiceError('Failed to generate invoice. Try again.');
      setGeneratingInvoice(false);
      return;
    }

    await supabase.from('quotes').update({ status: 'invoice_created', updated_at: new Date().toISOString() }).eq('id', invoiceModal.id);
    setQuotes(prev => prev.map(q => q.id === invoiceModal.id ? { ...q, status: 'invoice_created' as QuoteStatus } : q));
    setGeneratingInvoice(false);
    setInvoiceModal(null);
    setInvoiceMap(prev => new Map(prev).set(invoiceModal.id, { id: inv.id, status: 'unpaid' }));
    navigate(`/app/invoices/${inv.id}`);
  }

  async function handleStatusUpdate() {
    if (!statusModal) return;
    setUpdatingStatus(true);
    const { data } = await supabase
      .from('quotes')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', statusModal.id)
      .select()
      .maybeSingle();
    if (data) setQuotes(prev => prev.map(q => q.id === data.id ? data : q));
    setUpdatingStatus(false);
    setStatusModal(null);
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────────
  const sendWhatsApp = useCallback(async (q: Quote, type: 'quote' | 'followup') => {
    if (!profile?.studio_id) return;
    const phone = (q as any).client_phone ?? '';
    if (!phone) { setWaToast({ quoteId: q.id, status: 'no_phone' }); setTimeout(() => setWaToast(null), 5000); return; }
    setSendingWaId(q.id);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      let followup_number: number | undefined;
      let bodyValues: string[];

      if (type === 'quote') {
        bodyValues = [q.client_name ?? 'there', studio?.name ?? 'our studio'];
      } else {
        // Determine follow-up cycle: check how many follow-ups already sent
        const { data: logs } = await supabase
          .from('whatsapp_logs')
          .select('id, message_type, status')
          .eq('quote_id', q.id)
          .eq('message_type', 'follow_up')
          .eq('status', 'sent');
        followup_number = (logs?.length ?? 0) + 1;
        bodyValues = [q.client_name ?? 'there', studio?.name ?? 'our studio'];
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/interakt-send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studio_id: profile.studio_id,
          quote_id: q.id,
          message_type: type === 'quote' ? 'quote_sent' : 'follow_up',
          phone,
          body_values: bodyValues,
          followup_number,
        }),
      });
      let json: any = {};
      try { json = await res.json(); } catch { /**/ }
      if (json.configured === false) {
        setWaToast({ quoteId: q.id, status: 'not_configured' });
      } else if (json.success === true) {
        setWaToast({ quoteId: q.id, status: 'sent' });
        if (type === 'quote') {
          const now = new Date().toISOString();
          const followUpAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
          setQuotes(prev => prev.map(item => item.id === q.id ? { ...item, status: 'sent' as QuoteStatus, whatsapp_sent_at: now, follow_up_scheduled_at: followUpAt, updated_at: now } : item));
        } else {
          const now = new Date().toISOString();
          setQuotes(prev => prev.map(item => item.id === q.id ? { ...item, status: 'follow_up_pending' as QuoteStatus, follow_up_sent_at: now, updated_at: now } : item));
        }
      } else {
        setWaToast({ quoteId: q.id, status: 'failed' });
      }
      setTimeout(() => setWaToast(null), 5000);
    } catch {
      setWaToast({ quoteId: q.id, status: 'failed' });
      setTimeout(() => setWaToast(null), 5000);
    } finally {
      setSendingWaId(null);
    }
  }, [profile?.studio_id, studio]);

  const handleSendWhatsApp = (q: Quote) => sendWhatsApp(q, 'quote');
  const handleSendFollowUp = (q: Quote) => sendWhatsApp(q, 'followup');

  // ── Tab counts ────────────────────────────────────────────────────────────────
  function tabCount(val: string) {
    if (val === 'all') return quotes.length;
    return quotes.filter(q => q.status === val).length;
  }

  // ── Delete modal state helpers ────────────────────────────────────────────────
  const deleteHasInvoice = deleteTarget ? invoiceMap.has(deleteTarget.id) : false;

  // ── Quote Actions Menu ──────────────────────────────────────────────────────
  function getQuoteActions(q: Quote) {
    const hasInv = invoiceMap.has(q.id);
    const inv = hasInv ? invoiceMap.get(q.id)! : null;
    const actions: { key: string; label: string; icon: React.ReactNode; onClick: () => void; destructive?: boolean; disabled?: boolean; disabledReason?: string }[] = [
      { key: 'view', label: 'View Quote', icon: <Eye className="w-4 h-4 shrink-0" />, onClick: () => setPreviewQuote(q) },
      { key: 'edit', label: 'Edit Quote', icon: <SquarePen className="w-4 h-4 shrink-0" />, onClick: () => navigate(`/app/quote-builder/${q.id}`) },
      { key: 'duplicate', label: 'Duplicate Quote', icon: <Copy className="w-4 h-4 shrink-0" />, onClick: () => handleDuplicate(q) },
      { key: 'whatsapp', label: 'Send via WhatsApp', icon: <MessageCircle className="w-4 h-4 shrink-0" />, onClick: () => handleSendWhatsApp(q), disabled: sendingWaId === q.id, disabledReason: 'Sending…' },
      { key: 'status', label: 'Update Status', icon: <Pencil className="w-4 h-4 shrink-0" />, onClick: () => { setNewStatus(q.status); setStatusModal(q); } },
    ];
    if (inv) {
      actions.push({ key: 'invoice', label: 'View Invoice', icon: <ExternalLink className="w-4 h-4 shrink-0" />, onClick: () => navigate(`/app/invoices/${inv.id}`) });
    } else if (canGenerateInvoice(q)) {
      actions.push({
        key: 'invoice',
        label: 'Generate Invoice',
        icon: <Receipt className="w-4 h-4 shrink-0" />,
        onClick: () => {
          setInvoiceGstRate(studio?.gst_number ? '18' : '0');
          setInvoiceDueDate('');
          setInvoiceNotes('');
          setInvoiceError('');
          setInvoiceModal(q);
        },
      });
    }
    actions.push({ key: 'delete', label: 'Delete Quote', icon: <Trash2 className="w-4 h-4 shrink-0" />, onClick: () => { setDeleteTarget(q); setDeleteInvoiceToo(false); }, destructive: true });
    return actions;
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Quotes</h2>
        </div>
        {limitReached ? (
          <div className="flex items-center gap-2">
            <button disabled className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-surface border border-border text-ink-subtle cursor-not-allowed opacity-60">
              <Lock className="w-3.5 h-3.5" /> Create Quote
            </button>
            <Button onClick={() => navigate('/app/settings?tab=billing')} className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700">
              Upgrade Plan
            </Button>
          </div>
        ) : (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/app/quote-builder')}>
            Create Quote
          </Button>
        )}
      </div>

      {/* Limit banner */}
      {limitReached && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              {isTrialExpired ? 'Your free trial is over.' : "You've reached your monthly limit"}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {isTrialExpired ? 'You used all 10 free trial quotes. Upgrade to a paid plan to continue.' : 'Upgrade to continue creating quotes.'}
            </p>
          </div>
          <button onClick={() => navigate('/app/settings?tab=billing')} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
            {isTrialExpired ? 'Upgrade Now' : 'Upgrade Plan'}
          </button>
        </div>
      )}

      {/* Hot leads */}
      {hotLeads.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">{hotLeads.length} hot lead{hotLeads.length !== 1 ? 's' : ''} — follow up now!</p>
            <p className="text-xs text-green-700 mt-0.5 truncate">{hotLeads.map(q => q.client_name).join(', ')}</p>
          </div>
          <button onClick={() => setStatusFilter('interested')} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-semibold shrink-0">
            View <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* WhatsApp toast */}
      {waToast && (
        <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 border ${waToast.status === 'sent' ? 'bg-green-50 border-green-200' : waToast.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          {waToast.status === 'sent' && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
          {waToast.status === 'failed' && <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
          {(waToast.status === 'not_configured' || waToast.status === 'no_phone') && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            {waToast.status === 'sent' && <p className="text-sm text-green-700 font-medium">WhatsApp message sent successfully.</p>}
            {waToast.status === 'failed' && (<><p className="text-sm text-red-700 font-medium">WhatsApp could not be sent. Your quotation is saved. Please try again later.</p></>) }
            {waToast.status === 'not_configured' && (<><p className="text-sm text-amber-700 font-medium">WhatsApp is not available.</p><p className="text-xs text-amber-600 mt-0.5">WhatsApp messaging is currently unavailable. Please contact SnapQuote support.</p></>)}
            {waToast.status === 'no_phone' && <p className="text-sm text-amber-700">No phone number on this quote — message not sent.</p>}
          </div>
          <button onClick={() => setWaToast(null)} className="shrink-0 text-ink-subtle hover:text-ink transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table card */}
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">

        {/* Search + filter bar */}
        <div className="px-5 py-4 border-b border-border flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by quote #, client name, phone, event type..."
                className="w-full bg-surface-raised border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <Filter className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
              >
                {FILTER_TABS.map(t => (
                  <option key={t.value} value={t.value}>{t.label} ({tabCount(t.value)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter tabs — desktop */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {FILTER_TABS.map(tab => {
              const count = tabCount(tab.value);
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-ink-subtle'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-5 h-5" />}
            title={quotes.length === 0 ? 'No quotes yet' : 'No quotes match'}
            description={quotes.length === 0 ? 'Create your first quote using the Quote Builder.' : 'Try adjusting your search or filter.'}
            action={quotes.length === 0 ? { label: 'Create Quote', onClick: () => navigate('/app/quote-builder') } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] sm:min-w-0">
              <thead>
                <tr className="bg-surface-raised/60 border-b border-border">
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => toggleSort('quote_number')} className="flex items-center text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em] hover:text-ink transition-colors">
                      Quote # <SortIcon field="quote_number" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => toggleSort('client_name')} className="flex items-center text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em] hover:text-ink transition-colors">
                      Client <SortIcon field="client_name" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">
                    <span className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em]">Event</span>
                  </th>
                  <th className="px-5 py-3 text-left">
                    <button onClick={() => toggleSort('created_at')} className="flex items-center text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em] hover:text-ink transition-colors">
                      Date <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left hidden lg:table-cell">
                    <button onClick={() => toggleSort('valid_until')} className="flex items-center text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em] hover:text-ink transition-colors">
                      Valid Till <SortIcon field="valid_until" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-right">
                    <button onClick={() => toggleSort('amount')} className="flex items-center justify-end text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em] hover:text-ink transition-colors ml-auto">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-left">
                    <span className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em]">Status</span>
                  </th>
                  <th className="px-5 py-3 text-right">
                    <span className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.06em]">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(q => {
                  const isHot = HOT_STATUSES.has(q.status);
                  const hasInv = invoiceMap.has(q.id);
                  const inv = hasInv ? invoiceMap.get(q.id)! : null;
                  const isExpiredDate = q.valid_until && new Date(q.valid_until) < new Date() && q.status !== 'accepted' && q.status !== 'paid' && q.status !== 'invoice_created';
                  return (
                    <tr
                      key={q.id}
                      className={`transition-colors duration-100 ${isHot ? 'bg-green-50/40 hover:bg-green-50/70' : 'hover:bg-slate-50/80'}`}
                    >
                      {/* Quote # */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/app/quote-builder/${q.id}`)}
                          className="flex items-center gap-1.5 group"
                        >
                          {isHot && <Flame className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                          <span className="text-sm font-semibold text-primary-600 font-mono group-hover:underline transition-all">{q.quote_number}</span>
                        </button>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-ink leading-tight">{q.client_name}</p>
                        {q.client_email && <p className="text-xs text-ink-subtle mt-0.5 truncate max-w-[180px]">{q.client_email}</p>}
                        {(q as any).client_phone && <p className="text-xs text-ink-subtle">{(q as any).client_phone}</p>}
                      </td>

                      {/* Event */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-ink-muted">{(q as any).event_type || '—'}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-ink-muted tabular-nums">{fmtDate(q.created_at)}</span>
                      </td>

                      {/* Valid till */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className={`text-sm tabular-nums ${isExpiredDate ? 'text-red-500 font-medium' : 'text-ink-muted'}`}>
                          {fmtDate(q.valid_until)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-semibold text-ink tabular-nums">{formatCurrency(Number(q.amount))}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {quoteStatusBadge(q.status)}
                          {inv && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${INVOICE_STATUS_LABELS[inv.status]?.cls ?? 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                              {INVOICE_STATUS_LABELS[inv.status]?.label ?? 'Invoice'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <QuoteActionsMenu actions={getQuoteActions(q)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-surface-raised/40 flex items-center justify-between">
            <p className="text-xs text-ink-subtle">
              Showing <span className="font-semibold text-ink">{filtered.length}</span> of <span className="font-semibold text-ink">{quotes.length}</span> quotes
            </p>
            {search || statusFilter !== 'all' ? (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Status Update Modal ─────────────────────────────────────────────── */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update Quote Status"
        description={statusModal ? `${statusModal.quote_number} · ${statusModal.client_name}` : ''}
        width="sm"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-1">
            {STATUS_OPTIONS.map(o => (
              <label
                key={o.value}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                  newStatus === o.value ? 'border-primary-600 bg-primary-50' : 'border-border hover:bg-surface-raised'
                }`}
              >
                <input type="radio" name="status" value={o.value} checked={newStatus === o.value} onChange={() => setNewStatus(o.value)} className="accent-primary-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{o.label}</span>
                    {o.value === 'interested' && <Flame className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <p className="text-xs text-ink-subtle mt-0.5">{o.description}</p>
                </div>
                <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.value]}`}>{o.label}</span>
              </label>
            ))}
          </div>

          {newStatus === 'follow_up_pending' && statusModal && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1 text-xs text-amber-700">Send a follow-up message via WhatsApp after updating status.</div>
              <button
                disabled={sendingWaId === statusModal.id}
                onClick={() => handleSendFollowUp(statusModal)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline shrink-0 disabled:opacity-50"
              >
                {sendingWaId === statusModal.id ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button size="sm" loading={updatingStatus} onClick={handleStatusUpdate}>Update Status</Button>
          </div>
        </div>
      </Modal>

      {/* ── Invoice Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={!!invoiceModal}
        onClose={() => setInvoiceModal(null)}
        title="Generate Invoice"
        description={invoiceModal ? `${invoiceModal.quote_number} · ${invoiceModal.client_name}` : ''}
        width="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-surface-raised rounded-lg border border-border">
            <span className="text-sm text-ink-muted">Quote Amount</span>
            <span className="text-sm font-bold text-ink tabular-nums">
              {invoiceModal ? formatCurrency(Number(invoiceModal.amount)) : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">GST Rate <span className="text-ink-subtle font-normal">(0 if not applicable)</span></label>
            <div className="relative">
              <input
                type="number" min="0" max="100" step="0.5"
                value={invoiceGstRate}
                onChange={e => setInvoiceGstRate(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-md px-3 pr-8 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm">%</span>
            </div>
            {invoiceModal && parseFloat(invoiceGstRate) > 0 && (
              <p className="text-xs text-ink-muted">
                GST: {formatCurrency(Math.round(Number(invoiceModal.amount) * parseFloat(invoiceGstRate) / 100))} → Total: {formatCurrency(Number(invoiceModal.amount) + Math.round(Number(invoiceModal.amount) * parseFloat(invoiceGstRate) / 100))}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Payment Due Date <span className="text-ink-subtle font-normal">(optional)</span></label>
            <input type="date" value={invoiceDueDate} onChange={e => setInvoiceDueDate(e.target.value)} className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Notes <span className="text-ink-subtle font-normal">(optional)</span></label>
            <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} rows={2} placeholder="Payment instructions, bank details, etc." className="bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all resize-none" />
          </div>
          {invoiceError && <p className="text-xs text-red-600">{invoiceError}</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={() => setInvoiceModal(null)}>Cancel</Button>
            <Button size="sm" loading={generatingInvoice} icon={<Receipt className="w-3.5 h-3.5" />} onClick={handleGenerateInvoice}>Generate Invoice</Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => { if (!deleting) { setDeleteTarget(null); setDeleteInvoiceToo(false); } }}
        title="Delete Quote"
        width="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-ink">{deleteTarget.quote_number}</span>{' '}
              for <span className="font-semibold text-ink">{deleteTarget.client_name}</span>?
              {' '}This action cannot be undone.
            </p>

            {deleteHasInvoice && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">This quotation has a linked invoice</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Deleting this quote may affect invoice records. Choose how to handle the linked invoice below.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${!deleteInvoiceToo ? 'border-amber-400 bg-amber-50' : 'border-border bg-white hover:bg-surface-raised'}`}>
                    <input type="radio" name="invoiceChoice" checked={!deleteInvoiceToo} onChange={() => setDeleteInvoiceToo(false)} className="mt-0.5 accent-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-ink">Delete Quote & Keep Invoice</p>
                      <p className="text-xs text-ink-subtle mt-0.5">The invoice record will be preserved in Payments & Invoices.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${deleteInvoiceToo ? 'border-red-400 bg-red-50' : 'border-border bg-white hover:bg-surface-raised'}`}>
                    <input type="radio" name="invoiceChoice" checked={deleteInvoiceToo} onChange={() => setDeleteInvoiceToo(true)} className="mt-0.5 accent-red-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-ink">Delete Quote & Linked Invoice</p>
                      <p className="text-xs text-ink-subtle mt-0.5">Both the quote and its invoice will be permanently deleted.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => { setDeleteTarget(null); setDeleteInvoiceToo(false); }} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
                {deleteHasInvoice && deleteInvoiceToo ? 'Delete Quote & Invoice' : 'Delete Quote'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Quote Preview Modal ─────────────────────────────────────────────── */}
      {previewQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setPreviewQuote(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-[860px] w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
              <div>
                <p className="text-sm font-semibold text-ink">{previewQuote.quote_number}</p>
                <p className="text-xs text-ink-subtle mt-0.5">{previewQuote.client_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsApp(previewQuote)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Send via WhatsApp
                </button>
                <button
                  onClick={() => setPreviewQuote(null)}
                  className="w-11 h-11 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <div className="w-full" style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: '320px' }}>
                  <QuoteDocument
                    ref={previewRef}
                    studio={buildStudioInfo(studio)}
                    lead={buildLead(previewQuote)}
                    items={getItems(previewQuote)}
                    finalPrice={previewQuote.amount != null ? String(previewQuote.amount) : ''}
                    showDiscount={(previewQuote as any).show_discount ?? false}
                    quoteNumber={previewQuote.quote_number}
                    themeId={(previewQuote as any).theme_id}
                    quoteOptions={(previewQuote as any).quote_options as QuoteOptions | undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
