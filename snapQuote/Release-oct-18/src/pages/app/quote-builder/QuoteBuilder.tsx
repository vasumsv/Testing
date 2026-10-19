import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageCircle, FileText, Check, AlertTriangle, ArrowUpCircle, Lock, Sparkles, ArrowLeft, Save, Send, X, CheckCircle2, XCircle, AlertCircle, Phone, Eye, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Toggle } from '../../../components/ui/Toggle';
import { createPortal } from 'react-dom';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Client, Service, Package as PkgType } from '../../../types';
import { LineItem, SelectedLead, StudioInfo, QuoteOptions, QuoteEvent, PackageDeliverables, DeliverableMode, TypographyConfig, DEFAULT_TYPOGRAPHY } from './types';
import { LeftPanel } from './LeftPanel';
import { MiddlePanel } from './MiddlePanel';
import { RightPanel } from './RightPanel';
import { ThemeSelector } from './ThemeSelector';
import { DEFAULT_TEMPLATE_ID } from './themes';
import { QuoteDocument } from './QuoteDocument';
import { generateQuotePdf, generateQuotePdfBlob } from './generatePdf';
import { buildWhatsAppUrl } from './whatsapp';
import { SendProgressModal, SendStage } from './SendProgressModal';
import { useSubscription } from '../../../hooks/useSubscription';
import { QuotaBar } from '../../../components/ui/QuotaBar';
import { useNavigationGuard } from '../../../contexts/NavigationGuardContext';
import { fetchStudioData, subscribeToStudioData } from '../../../lib/studioDataCache';

const EMPTY_STUDIO: StudioInfo = {
  name: '', email: '', phone: '', address: '',
  website: '', gst_number: '', owner_name: '', logo_url: '',
  watermark_url: undefined,
  portfolio_images: [],
  details_section: '',
  terms_and_conditions: '',
};

type WaSendStatus = 'sent' | 'failed' | 'not_configured' | 'invalid_number' | 'pdf_upload_failed' | null;

function generateQuoteNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `QT-${n}`;
}

const DRAFT_KEY_NEW = 'snapquote_draft_new';

function FullPreviewModal({ quoteNumber, onClose, children }: { quoteNumber: string; onClose: () => void; children: React.ReactNode }) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', flexShrink: 0, background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye style={{ width: 16, height: 16, color: '#94a3b8' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Quote Preview</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{quoteNumber}</span>
        </div>
        <button
          onClick={onClose}
          style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
        >
          <X style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Scrollable area — the document sits at native 794px wide and scrolls vertically */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '32px 16px 64px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ width: '100%', maxWidth: '794px', minWidth: '320px', margin: '0 auto', borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function QuoteBuilder() {
  const { profile } = useAuth();
  const { quoteId } = useParams<{ quoteId?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!quoteId;
  const { quota, isBlocked, planLabel, usageText, usagePercent, refresh: refreshQuota, isTrial } = useSubscription(profile?.studio_id);

  const [leads, setLeads] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [studio, setStudio] = useState<StudioInfo>(EMPTY_STUDIO);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedLead, setSelectedLead] = useState<SelectedLead | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [finalPrice, setFinalPrice] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState(generateQuoteNumber);

  const [themeId, setThemeId] = useState(DEFAULT_TEMPLATE_ID);

  const [events, setEvents] = useState<QuoteEvent[]>([]);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [includeGst, setIncludeGst] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showDeliverables, setShowDeliverables] = useState(true);
  const [deliverableMode, setDeliverableMode] = useState<DeliverableMode>('default');
  const [customDeliverables, setCustomDeliverables] = useState<string[]>([]);
  const [customDeliverableInput, setCustomDeliverableInput] = useState('');
  const [packageDeliverableOverrides, setPackageDeliverableOverrides] = useState<Record<string, string[]>>({});
  const [editingPkg, setEditingPkg] = useState<{ packageId: string; packageName: string; deliverables: string[]; terms: string } | null>(null);
  const [editingPkgInput, setEditingPkgInput] = useState('');
  const [editingPkgBulk, setEditingPkgBulk] = useState('');
  const [packageTerms, setPackageTerms] = useState<Record<string, string>>({});
  const [showDefaultTerms, setShowDefaultTerms] = useState(true);
  const [showAdditionalTerms, setShowAdditionalTerms] = useState(false);
  const [additionalTerms, setAdditionalTerms] = useState<string[]>([]);
  const [additionalTermsInput, setAdditionalTermsInput] = useState('');
  const [additionalTermsBulkInput, setAdditionalTermsBulkInput] = useState('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(undefined);
  const [typography, setTypography] = useState<TypographyConfig | undefined>(undefined);

  const [waSendStatus, setWaSendStatus] = useState<WaSendStatus>(null);
  const [sendStage, setSendStage] = useState<SendStage>('idle');
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const initialLoadDone = useRef(false);
  const guard = useNavigationGuard();

  const docRef = useRef<HTMLDivElement>(null);

  const applyStudioData = useCallback((d: { clients: Client[]; services: Service[]; packages: PkgType[]; studio: Record<string, any> | null; portfolioImages: any[] }) => {
    setLeads(d.clients);
    setPackages(d.packages);
    setServices(d.services);
    if (d.studio) {
      const s = d.studio;
      setStudio({
        name: s.name ?? '',
        email: s.email ?? '',
        phone: s.phone ?? '',
        address: s.address ?? '',
        website: s.website ?? '',
        gst_number: s.gst_number ?? '',
        owner_name: s.owner_name ?? '',
        logo_url: s.logo_url ?? '',
        portfolio_images: d.portfolioImages ?? [],
        details_section: s.details_section ?? '',
        terms_and_conditions: s.terms_and_conditions ?? '',
        payment_details: s.payment_details ?? undefined,
        watermark_url: s.watermark_url ?? undefined,
        default_deliverables: Array.isArray(s.default_deliverables) ? s.default_deliverables : [],
      });
    }
  }, []);

  useEffect(() => {
    if (profile?.studio_id) loadData();
    else setDataLoading(false);
  }, [profile?.studio_id]);

  // Subscribe to studio data cache updates (e.g. when another page invalidates)
  useEffect(() => {
    if (!profile?.studio_id) return;
    const unsub = subscribeToStudioData(profile.studio_id, (data) => {
      applyStudioData(data);
    });
    return () => { unsub(); };
  }, [profile?.studio_id, applyStudioData]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!initialLoadDone.current) return;
    setIsDirty(true);
    setSaved(false);
  }, [selectedLead, items, finalPrice, showDiscount, themeId, events, includeSignature, includeGst, serviceName, showPaymentDetails, showWatermark, showPortfolio, showDeliverables, deliverableMode, customDeliverables, packageDeliverableOverrides, packageTerms, showDefaultTerms, showAdditionalTerms, additionalTerms, backgroundImageUrl, typography]);

  // Whether a new (unsaved) quote has any data worth protecting
  const hasNewQuoteData = !isEditMode && (
    selectedLead !== null ||
    items.length > 0 ||
    serviceName.trim() !== '' ||
    events.length > 0 ||
    additionalTerms.length > 0 ||
    !!backgroundImageUrl
  );

  // Unified navigation guard for both edit mode (dirty check) and new quote (has data)
  useEffect(() => {
    const dirty = isEditMode ? (isDirty && !saved) : hasNewQuoteData;
    guard.setDirty(dirty);
    return () => { guard.setDirty(false); };
  }, [isEditMode, isDirty, saved, hasNewQuoteData]);

  // beforeunload protection for both modes + during Save & Send processing
  useEffect(() => {
    const shouldWarn = (isEditMode && isDirty && !saved) || (!isEditMode && hasNewQuoteData) || guard.isProcessing();
    if (!shouldWarn) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isEditMode, isDirty, saved, hasNewQuoteData, guard.processing]);

  // Auto-save draft to localStorage (debounced 800ms) — fires on any form change after initial load
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const draft = {
      selectedLead, items, finalPrice, showDiscount, themeId, events,
      includeSignature, includeGst, serviceName, showPaymentDetails, showWatermark,
      showPortfolio, showDeliverables, deliverableMode, customDeliverables, packageDeliverableOverrides, packageTerms,
      showDefaultTerms, showAdditionalTerms,
      additionalTerms, quoteNumber, backgroundImageUrl, typography, savedAt: new Date().toISOString(),
    };
    const key = isEditMode ? `snapquote_draft_edit_${quoteId}` : DRAFT_KEY_NEW;
    const t = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(draft)); } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [selectedLead, items, finalPrice, showDiscount, themeId, events, includeSignature, includeGst, serviceName, showPaymentDetails, showWatermark, showPortfolio, showDeliverables, deliverableMode, customDeliverables, packageDeliverableOverrides, packageTerms, showDefaultTerms, showAdditionalTerms, additionalTerms, backgroundImageUrl, typography]);

  const pendingNav = guard.pendingNav;

  function safeNavigate(path: string) {
    if (guard.isProcessing()) return;
    const shouldGuard = (isEditMode && isDirty && !saved) || (!isEditMode && hasNewQuoteData);
    if (shouldGuard) {
      guard.setPendingNav(path);
      guard.onConfirmLeave.current = (dest: string) => {
        guard.setDirty(false);
        navigate(dest);
      };
    } else {
      navigate(path);
    }
  }

  async function loadData() {
    setDataLoading(true);
    const studioId = profile!.studio_id;

    // Use cached studio data (clients, services, packages, studio, portfolio)
    const cached = await fetchStudioData(studioId);
    applyStudioData(cached);

    // Subscribe to cache updates (e.g. when another page invalidates)
    // (subscription is handled in the separate useEffect below)

    // Quote-specific fetch only in edit mode
    if (isEditMode) {
      const { data: q } = await supabase.from('quotes').select('*').eq('id', quoteId).eq('studio_id', studioId).maybeSingle();
      if (q) {
      setQuoteNumber(q.quote_number);
      setItems(Array.isArray(q.items) ? q.items : []);
      setFinalPrice(q.final_price != null ? String(q.final_price) : '');
      setShowDiscount(q.show_discount ?? false);
      setThemeId(q.theme_id ?? DEFAULT_TEMPLATE_ID);
      if (q.quote_options) {
        const opts = q.quote_options as any;
        if (Array.isArray(opts.events) && opts.events.length > 0) setEvents(opts.events);
        if (typeof opts.includeSignature === 'boolean') setIncludeSignature(opts.includeSignature);
        if (typeof opts.includeGst === 'boolean') setIncludeGst(opts.includeGst);
        if (typeof opts.serviceName === 'string') setServiceName(opts.serviceName);
        if (typeof opts.showPaymentDetails === 'boolean') setShowPaymentDetails(opts.showPaymentDetails);
        if (typeof opts.showWatermark === 'boolean') setShowWatermark(opts.showWatermark);
        if (typeof opts.showPortfolio === 'boolean') setShowPortfolio(opts.showPortfolio);
        if (typeof opts.showDeliverables === 'boolean') setShowDeliverables(opts.showDeliverables);
        if (opts.deliverableMode === 'default' || opts.deliverableMode === 'package' || opts.deliverableMode === 'custom') setDeliverableMode(opts.deliverableMode);
        if (Array.isArray(opts.customDeliverables)) setCustomDeliverables(opts.customDeliverables);
        if (opts.packageDeliverableOverrides && typeof opts.packageDeliverableOverrides === 'object') setPackageDeliverableOverrides(opts.packageDeliverableOverrides);
        if (opts.packageTerms && typeof opts.packageTerms === 'object') setPackageTerms(opts.packageTerms);
        if (typeof opts.showDefaultTerms === 'boolean') setShowDefaultTerms(opts.showDefaultTerms);
        if (typeof opts.showAdditionalTerms === 'boolean') setShowAdditionalTerms(opts.showAdditionalTerms);
        if (Array.isArray(opts.additionalTerms)) setAdditionalTerms(opts.additionalTerms);
        if (typeof opts.backgroundImageUrl === 'string') setBackgroundImageUrl(opts.backgroundImageUrl || undefined);
        if (opts.typography && typeof opts.typography === 'object') setTypography(opts.typography);
      }
      if (q.client_name) {
        setSelectedLead({
          id: q.lead_id ?? '__quick__',
          full_name: q.client_name,
          phone: q.client_phone ?? '',
          email: q.client_email ?? '',
          event_type: '',
          event_date: null,
        });
      }
      }
    }

    // For new quotes: restore any existing draft from localStorage
    if (!isEditMode) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY_NEW);
        if (raw) {
          const draft = JSON.parse(raw);
          // Only restore drafts less than 48 hours old
          const age = Date.now() - new Date(draft.savedAt ?? 0).getTime();
          if (age < 48 * 60 * 60 * 1000) {
            if (draft.selectedLead !== undefined) setSelectedLead(draft.selectedLead);
            if (Array.isArray(draft.items)) setItems(draft.items);
            if (draft.finalPrice !== undefined) setFinalPrice(draft.finalPrice);
            if (typeof draft.showDiscount === 'boolean') setShowDiscount(draft.showDiscount);
            if (draft.themeId) setThemeId(draft.themeId);
            if (Array.isArray(draft.events)) setEvents(draft.events);
            if (typeof draft.includeSignature === 'boolean') setIncludeSignature(draft.includeSignature);
            if (typeof draft.includeGst === 'boolean') setIncludeGst(draft.includeGst);
            if (typeof draft.serviceName === 'string') setServiceName(draft.serviceName);
            if (typeof draft.showPaymentDetails === 'boolean') setShowPaymentDetails(draft.showPaymentDetails);
            if (typeof draft.showWatermark === 'boolean') setShowWatermark(draft.showWatermark);
            if (typeof draft.showPortfolio === 'boolean') setShowPortfolio(draft.showPortfolio);
            if (typeof draft.showDeliverables === 'boolean') setShowDeliverables(draft.showDeliverables);
            if (draft.deliverableMode === 'default' || draft.deliverableMode === 'package' || draft.deliverableMode === 'custom') setDeliverableMode(draft.deliverableMode);
            if (Array.isArray(draft.customDeliverables)) setCustomDeliverables(draft.customDeliverables);
            if (draft.packageDeliverableOverrides && typeof draft.packageDeliverableOverrides === 'object') setPackageDeliverableOverrides(draft.packageDeliverableOverrides);
            if (draft.packageTerms && typeof draft.packageTerms === 'object') setPackageTerms(draft.packageTerms);
            if (typeof draft.showDefaultTerms === 'boolean') setShowDefaultTerms(draft.showDefaultTerms);
            if (typeof draft.showAdditionalTerms === 'boolean') setShowAdditionalTerms(draft.showAdditionalTerms);
            if (Array.isArray(draft.additionalTerms)) setAdditionalTerms(draft.additionalTerms);
            if (draft.quoteNumber) setQuoteNumber(draft.quoteNumber);
            if (draft.backgroundImageUrl !== undefined) setBackgroundImageUrl(draft.backgroundImageUrl);
            if (draft.typography) setTypography(draft.typography);
            // Has meaningful data — show the "Draft restored" banner
            const hasDraftData = draft.selectedLead !== null || (Array.isArray(draft.items) && draft.items.length > 0) || (typeof draft.serviceName === 'string' && draft.serviceName.trim() !== '');
            if (hasDraftData) setDraftRestored(true);
          } else {
            localStorage.removeItem(DRAFT_KEY_NEW);
          }
        }
      } catch {}
    }

    setDataLoading(false);
    setTimeout(() => { initialLoadDone.current = true; }, 0);
  }

  const packageDeliverables = useMemo<PackageDeliverables[]>(() => {
    const seen = new Set<string>();
    const result: PackageDeliverables[] = [];
    items.forEach(item => {
      if (item.isPackageHeader && !seen.has(item.id)) {
        seen.add(item.id);
        const pkg = packages.find(p => p.id === item.id);
        const masterDeliverables = pkg && Array.isArray(pkg.deliverables) ? pkg.deliverables : [];
        const overrideDeliverables = packageDeliverableOverrides[item.id];
        const deliverables = overrideDeliverables ?? masterDeliverables;
        const terms = packageTerms[item.id] ?? '';
        result.push({ packageId: item.id, packageName: item.name, deliverables, terms: terms || undefined });
      }
    });
    return result;
  }, [items, packages, packageDeliverableOverrides, packageTerms]);

  const hasSelectedPackages = useMemo(() => items.some(i => i.isPackageHeader), [items]);

  // Auto-switch deliverable mode when packages are added/removed
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (hasSelectedPackages && deliverableMode === 'default' && (!studio.default_deliverables || studio.default_deliverables.length === 0)) {
      setDeliverableMode('package');
    } else if (!hasSelectedPackages && deliverableMode === 'package') {
      setDeliverableMode('default');
    }
  }, [hasSelectedPackages]);

  const quoteOptions = useMemo<QuoteOptions>(() => ({
    events,
    includeSignature,
    includeGst,
    serviceName,
    showPaymentDetails,
    showWatermark,
    showPortfolio,
    packageDeliverables: packageDeliverables.length > 0 ? packageDeliverables : undefined,
    showDeliverables,
    deliverableMode,
    customDeliverables,
    packageTerms: Object.keys(packageTerms).length > 0 ? packageTerms : undefined,
    showDefaultTerms,
    showAdditionalTerms,
    additionalTerms,
    backgroundImageUrl,
    typography,
  }), [events, includeSignature, includeGst, serviceName, showPaymentDetails, showWatermark, showPortfolio, packageDeliverables, showDeliverables, deliverableMode, customDeliverables, packageTerms, showDefaultTerms, showAdditionalTerms, additionalTerms, backgroundImageUrl, typography]);

  const { finalNum, baseAmount, displayTotal } = useMemo(() => {
    const sub = items.filter(i => i.enabled).reduce((s, i) => s + i.price, 0);
    const fn = parseFloat(finalPrice) || 0;
    const base = finalPrice !== '' && fn > 0 ? fn : sub;
    const gst = includeGst ? Math.round(base * 0.18 * 100) / 100 : 0;
    const total = Math.round((base + gst) * 100) / 100;
    return { finalNum: fn, baseAmount: base, displayTotal: total };
  }, [items, finalPrice, includeGst]);

  // When a quote is edited, push the updated amounts/items/client to the linked invoice.
  // Preserves existing gst_rate, due_date, notes, and payment history — only recalculates amounts.
  async function syncInvoiceToQuote(qId: string, studioId: string) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('id, gst_rate, status')
      .eq('quote_id', qId)
      .eq('studio_id', studioId)
      .maybeSingle();

    if (!inv) return; // no invoice for this quote yet

    // Use the invoice's own gst_rate (set independently at invoice creation time).
    // We only recalculate gst_amount and total from the updated quote amounts.
    const gstRate = Number(inv.gst_rate ?? 0);
    const enabledItems = items.filter(i => i.enabled);
    const subtotal = baseAmount; // accounts for final_price override
    const gstAmt = Math.round((subtotal * gstRate) / 100);
    const total = subtotal + gstAmt;

    await supabase
      .from('invoices')
      .update({
        client_name: selectedLead?.full_name ?? 'Unknown Client',
        client_email: selectedLead?.email ?? '',
        client_phone: selectedLead?.phone ?? '',
        subtotal,
        gst_amount: gstAmt,
        total,
        items: enabledItems,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inv.id)
      .eq('studio_id', studioId);
  }

  async function sendQuoteWhatsApp({ clientPhone, savedQuoteId, displayTotal, pdfBase64, pdfFilename }: { clientPhone: string; savedQuoteId: string | null; displayTotal: number; pdfBase64: string | null; pdfFilename: string }): Promise<{ success: boolean; status: WaSendStatus }> {
    if (!clientPhone) {
      setWaSendStatus('invalid_number');
      return { success: false, status: 'invalid_number' };
    }

    if (!pdfBase64) {
      console.warn('[QuoteBuilder] Skipping Interakt send — PDF generation failed, no base64 data');
      setWaSendStatus('pdf_upload_failed');
      return { success: false, status: 'pdf_upload_failed' };
    }

    console.log('[QuoteBuilder] Sending to interakt-send edge function. PDF base64 length:', pdfBase64.length);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/interakt-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studio_id: profile!.studio_id,
          quote_id: savedQuoteId,
          message_type: 'quote_sent',
          phone: clientPhone,
          pdf_base64: pdfBase64,
          pdf_filename: pdfFilename,
          body_values: [
            selectedLead?.full_name ?? 'there',
            studio.name || 'our studio',
          ],
        }),
      });

      let json: any = {};
      try { json = await res.json(); } catch { /* non-JSON */ }

      console.log('[QuoteBuilder] interakt-send response:', JSON.stringify(json));

      if (json.configured === false) {
        setWaSendStatus('not_configured');
        return { success: false, status: 'not_configured' };
      } else if (json.pdf_upload_failed) {
        setWaSendStatus('failed');
        return { success: false, status: 'failed' };
      } else if (json.success === true) {
        setWaSendStatus('sent');
        return { success: true, status: 'sent' };
      } else {
        setWaSendStatus('failed');
        return { success: false, status: 'failed' };
      }
    } catch (err) {
      console.error('[QuoteBuilder] interakt-send network error:', err);
      setWaSendStatus('failed');
      return { success: false, status: 'failed' };
    }
  }

  // Returns the client_id for the selected lead, creating or updating a client
  // record as needed. Deduplicates by studio_id + phone within the studio.
  // Also returns whether selectedLead.id was a client record (so persistQuote
  // knows not to write it into the lead_id FK column).
  async function upsertClient(): Promise<{ clientId: string | null; idIsClient: boolean }> {
    if (!profile?.studio_id || !selectedLead) return { clientId: null, idIsClient: false };
    const studioId = profile.studio_id;
    const phone = (selectedLead.phone ?? '').trim();
    const name = (selectedLead.full_name ?? '').trim();
    if (!name) return { clientId: null, idIsClient: false };

    try {
      // If the selected lead already has a real id (not __quick__), check if it's a client
      if (selectedLead.id && selectedLead.id !== '__quick__') {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('id', selectedLead.id)
          .eq('studio_id', studioId)
          .maybeSingle();
        if (existing) {
          await supabase
            .from('clients')
            .update({
              full_name: name,
              phone,
              email: selectedLead.email ?? '',
              event_type: selectedLead.event_type ?? '',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          return { clientId: existing.id, idIsClient: true };
        }
        // It's a lead_id — try to find a matching client by lead's phone
      }

      // Dedup by phone within studio
      if (phone) {
        const { data: match } = await supabase
          .from('clients')
          .select('id')
          .eq('studio_id', studioId)
          .eq('phone', phone)
          .maybeSingle();
        if (match) {
          await supabase
            .from('clients')
            .update({
              full_name: name,
              email: selectedLead.email ?? '',
              event_type: selectedLead.event_type ?? '',
              updated_at: new Date().toISOString(),
            })
            .eq('id', match.id);
          return { clientId: match.id, idIsClient: false };
        }
      }

      // Create new client
      const { data: created, error } = await supabase
        .from('clients')
        .insert({
          studio_id: studioId,
          full_name: name,
          phone,
          email: selectedLead.email ?? '',
          event_type: selectedLead.event_type ?? '',
        })
        .select('id')
        .maybeSingle();

      if (error || !created) return { clientId: null, idIsClient: false };
      return { clientId: created.id, idIsClient: false };
    } catch {
      return { clientId: null, idIsClient: false };
    }
  }

  // Returns the saved quote ID on success, or null on failure.
  // Handles both new quotes (insert) and existing quotes (update).
  async function persistQuote(): Promise<string | null> {
    if (!profile?.studio_id) return null;

    // Auto-create or update client record from selected lead
    const { clientId, idIsClient } = await upsertClient();

    // Only set lead_id if selectedLead.id is a genuine lead ID (not a client UUID).
    // Client IDs go into client_id, not lead_id — writing a client UUID into lead_id
    // violates the quotes_lead_id_fkey foreign key constraint.
    const leadId = (selectedLead && selectedLead.id !== '__quick__' && !idIsClient) ? selectedLead.id : null;

    const quotePayload = {
      lead_id: leadId,
      client_id: clientId,
      client_name: selectedLead?.full_name ?? 'Unknown Client',
      client_email: selectedLead?.email ?? '',
      client_phone: selectedLead?.phone ?? '',
      amount: displayTotal,
      final_price: finalPrice !== '' && finalNum > 0 ? finalNum : null,
      show_discount: showDiscount,
      items: items,
      theme_id: themeId,
      quote_options: quoteOptions,
      updated_at: new Date().toISOString(),
    };

    if (isEditMode) {
      const { error } = await supabase
        .from('quotes')
        .update(quotePayload)
        .eq('id', quoteId)
        .eq('studio_id', profile.studio_id);

      if (error) {
        setSaveError(error.message || 'Failed to update quote. Please try again.');
        return null;
      }

      await syncInvoiceToQuote(quoteId!, profile.studio_id);
      setIsDirty(false);
      guard.setDirty(false);
      try { localStorage.removeItem(`snapquote_draft_edit_${quoteId}`); } catch {}
      return quoteId!;
    } else {
      if (isBlocked) return null;

      const { data: inserted, error } = await supabase
        .from('quotes')
        .insert({ studio_id: profile.studio_id, quote_number: quoteNumber, status: 'draft', ...quotePayload })
        .select('id')
        .maybeSingle();

      if (error) {
        const msg = error.message ?? '';
        if (msg.includes('trial_limit_reached')) {
          setSaveError('Your free trial quota is exhausted. Please upgrade to a paid plan to continue creating quotes.');
        } else if (msg.includes('limit_reached') || msg.includes('quote limit')) {
          setSaveError('Monthly quote limit reached. Upgrade your plan to continue.');
        } else if (msg.includes('studio_inactive') || msg.includes('inactive')) {
          setSaveError('Your account is currently inactive. Please contact support.');
        } else if (msg.includes('subscription_expired') || msg.includes('expired')) {
          setSaveError('Your subscription has expired. Please renew to continue.');
        } else {
          setSaveError(msg || 'Failed to save quote. Please try again.');
        }
        await refreshQuota();
        return null;
      }

      const newId = inserted?.id ?? null;
      if (newId) {
        await supabase.rpc('increment_studio_quote_count', { p_studio_id: profile.studio_id, p_quote_id: newId });
      }
      await refreshQuota();
      try { localStorage.removeItem(DRAFT_KEY_NEW); } catch {}
      return newId;
    }
  }

  async function handleSaveOnly() {
    if (!profile?.studio_id) return;
    if (!isEditMode && (limitReached || isBlocked)) return;

    setSaving(true);
    setSaveError(null);

    const savedId = await persistQuote();

    setSaving(false);
    if (savedId) {
      setSaved(true);
      setDraftRestored(false);
      setTimeout(() => setSaved(false), 3000);
      // Navigate to edit mode if this was a new quote
      if (!isEditMode) navigate(`/app/quote-builder/${savedId}`, { replace: true });
    }
  }

  async function handleDownload() {
    if (!profile?.studio_id) return;
    if (!isEditMode && (limitReached || isBlocked)) return;
    if (downloading || sendStage !== 'idle') return;

    // Activate processing lock — blocks navigation
    guard.setProcessing(true);
    setDownloading(true);
    setSaveError(null);
    setWaSendStatus(null);
    setSendErrorMessage(null);
    setSendSuccessMessage(null);
    setSendStage('saving');

    let savedQuoteId: string | null = isEditMode ? (quoteId ?? null) : null;
    let quoteWasSaved = false;

    // ── Stage 1: Save the quotation ─────────────────────────────────────────
    const needsSave = isEditMode ? (isDirty && !saved) : true;
    if (needsSave) {
      savedQuoteId = await persistQuote();
      if (!savedQuoteId) {
        setDownloading(false);
        guard.setProcessing(false);
        setSendErrorMessage(saveError || 'Failed to save your quotation. Please check your plan limits and try again.');
        setSendStage('error');
        return;
      }
      quoteWasSaved = true;
      setSaved(true);
      setDraftRestored(false);
      setTimeout(() => setSaved(false), 3000);
      if (!isEditMode) navigate(`/app/quote-builder/${savedQuoteId}`, { replace: true });
    } else {
      quoteWasSaved = true;
    }

    // ── Stage 2: Generate the PDF ───────────────────────────────────────────
    setSendStage('preparing_pdf');

    const clientName = selectedLead?.full_name
      ? selectedLead.full_name.replace(/\s+/g, '-').toLowerCase()
      : 'quotation';
    const filename = `${quoteNumber}-${clientName}.pdf`;

    let pdfBlob: Blob | null = null;
    let pdfBase64: string | null = null;

    try {
      if (!docRef.current) throw new Error('Document element not mounted');
      pdfBlob = await generateQuotePdfBlob(docRef.current);

      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      const arrayBuf = await pdfBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      pdfBase64 = btoa(binary);
    } catch (err) {
      console.error('[QuoteBuilder] PDF generation failed:', err);
      setDownloading(false);
      guard.setProcessing(false);
      setSendErrorMessage(
        quoteWasSaved
          ? 'Your quotation was saved successfully, but the PDF could not be generated. You can download it later from the Quotes page.'
          : 'PDF generation failed. Please try again.'
      );
      setSendStage('error');
      return;
    }

    // ── Stage 3: Send via WhatsApp ──────────────────────────────────────────
    setSendStage('sending_whatsapp');

    const waResult = await sendQuoteWhatsApp({
      clientPhone: selectedLead?.phone ?? '',
      savedQuoteId,
      displayTotal,
      pdfBase64,
      pdfFilename: filename,
    });

    // ── Stage 4: Confirm delivery (only if WA returned success) ────────────
    if (waResult.success) {
      setSendStage('confirming');
      // The edge function logs to whatsapp_logs and updates quote status.
      // This is a real confirmation from Interakt's API response.
      await new Promise(resolve => setTimeout(resolve, 600));
      setSendSuccessMessage('Your quotation has been saved and sent to your client via WhatsApp.');
      setSendStage('success');
    } else {
      const status = waResult.status ?? 'failed';
      const messages: Record<string, string> = {
        invalid_number: 'Your quotation was saved and the PDF was downloaded, but no phone number is linked to this client. Add a phone number and try sending again.',
        not_configured: 'Your quotation was saved and the PDF was downloaded, but WhatsApp messaging is not configured on your account. Please contact SnapQuote support.',
        pdf_upload_failed: 'Your quotation was saved and the PDF was downloaded, but it could not be uploaded for WhatsApp delivery. Please try again later.',
        failed: 'Your quotation was saved and the PDF was downloaded, but the WhatsApp message could not be delivered. Please try sending again from the Quotes page.',
      };
      setSendErrorMessage(messages[status] || 'Your quotation was saved, but WhatsApp delivery failed. Please try again later.');
      setSendStage('error');
    }

    setDownloading(false);
    guard.setProcessing(false);
  }

  function dismissSendModal() {
    setSendStage('idle');
    setSendErrorMessage(null);
    setSendSuccessMessage(null);
  }

  function handleWhatsApp() {
    const enabledItems = items.filter(i => i.enabled);
    const url = buildWhatsAppUrl({
      lead: selectedLead,
      quoteNumber,
      displayTotal,
      enabledItems,
      studioName: studio.name,
      events,
    });
    window.open(url, '_blank');
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const limitReached = quota?.limit_reached ?? false;
  const nearLimit = quota?.near_limit ?? false;

  return (
    <div className="relative flex flex-col gap-4 h-full pb-24 min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isEditMode && (
            <button
              onClick={() => safeNavigate('/app/quotes')}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors shrink-0"
              title="Back to Quotes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-ink">
                {isEditMode ? 'Edit Quote' : 'Quote Builder'}
              </h2>
              {isEditMode && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                  Editing
                </span>
              )}
              {isEditMode && isDirty && !saved && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-600 border border-orange-200">
                  Unsaved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-ink-muted">{quoteNumber}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Draft
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ThemeSelector
            selectedId={themeId}
            onChange={setThemeId}
            plan={quota?.plan ?? 'trial'}
            previewData={{ studio, lead: selectedLead, items, finalPrice, showDiscount, quoteNumber, quoteOptions }}
          />
          <button
            onClick={() => setShowFullPreview(true)}
            className="flex items-center gap-1.5 bg-surface border border-border rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface-raised transition-colors"
            title="Full quote preview"
          >
            <Eye className="w-3.5 h-3.5 text-ink-subtle" />
            <span className="hidden sm:inline">Preview</span>
          </button>
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageCircle className="w-3.5 h-3.5" />}
            onClick={handleWhatsApp}
            disabled={!isEditMode && (limitReached || isBlocked)}
            title="Use personal WhatsApp"
          >
            <span className="hidden sm:inline">Personal WA</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={
              saved
                ? <Check className="w-3.5 h-3.5" />
                : <Save className="w-3.5 h-3.5" />
            }
            loading={saving}
            onClick={handleSaveOnly}
            disabled={(!isEditMode && (limitReached || isBlocked)) || (isEditMode && saved) || downloading || sendStage !== 'idle'}
            className={saved ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : ''}
          >
            {saved
              ? <span className="hidden sm:inline">Saved</span>
              : (!isEditMode && limitReached)
                ? <span>Limit</span>
                : <span className="hidden sm:inline">Save</span>}
          </Button>
          <Button
            size="sm"
            icon={
              (!isEditMode && limitReached)
                ? <Lock className="w-3.5 h-3.5" />
                : <Send className="w-3.5 h-3.5" />
            }
            loading={downloading}
            onClick={handleDownload}
            disabled={(!isEditMode && (limitReached || isBlocked)) || saving || sendStage !== 'idle'}
          >
            {(!isEditMode && limitReached)
              ? <span>Limit</span>
              : <span className="hidden sm:inline">Save & Send</span>}
          </Button>
        </div>
      </div>

      {quota && (
        <QuotaBar
          plan={planLabel}
          used={quota.quotes_this_month}
          limit={quota.monthly_limit}
          usageText={usageText}
          usagePercent={usagePercent}
          nearLimit={nearLimit}
          limitReached={limitReached}
          expiresAt={quota.subscription_expires_at}
          isActive={quota.is_active && quota.status !== 'suspended'}
          isTrial={isTrial}
        />
      )}

      {/* Progress strip */}
      <div className="hidden sm:flex items-center gap-1 bg-white border border-border rounded-xl px-4 py-3">
        {[
          { num: 1, label: 'Details', desc: 'Client & event' },
          { num: 2, label: 'Packages', desc: 'Services & pricing' },
          { num: 3, label: 'Design', desc: 'Template & branding' },
          { num: 4, label: 'Review', desc: 'Check & finalize' },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-semibold text-primary-700">
                {step.num}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink leading-tight">{step.label}</p>
                <p className="text-[11px] text-ink-subtle leading-tight">{step.desc}</p>
              </div>
            </div>
            {i < 3 && <div className="flex-1 h-px bg-border mx-1 min-w-4" />}
          </div>
        ))}
      </div>

      {saved && isEditMode && (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">Quote updated successfully</p>
        </div>
      )}

      {draftRestored && (
        <div className="flex items-center justify-between gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-700 font-medium">Draft restored from your last session</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedLead(null);
                setItems([]);
                setFinalPrice('');
                setShowDiscount(false);
                setThemeId(DEFAULT_TEMPLATE_ID);
                setEvents([]);
                setIncludeSignature(false);
                setIncludeGst(false);
                setServiceName('');
                setShowPaymentDetails(false);
                setShowWatermark(false);
                setShowPortfolio(true);
                setShowDeliverables(true);
                setDeliverableMode('default');
                setCustomDeliverables([]);
                setPackageDeliverableOverrides({});
                setPackageTerms({});
                setShowDefaultTerms(true);
                setShowAdditionalTerms(false);
                setAdditionalTerms([]);
                setQuoteNumber(generateQuoteNumber());
                setDraftRestored(false);
                try { localStorage.removeItem(DRAFT_KEY_NEW); } catch {}
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 transition-colors"
            >
              Start fresh
            </button>
            <button
              onClick={() => setDraftRestored(false)}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      {waSendStatus === 'sent' && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">WhatsApp message sent successfully.</p>
        </div>
      )}
      {waSendStatus === 'failed' && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">WhatsApp could not be sent. Your quotation is saved. Please try again later.</p>
          </div>
        </div>
      )}
      {waSendStatus === 'not_configured' && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-700 font-medium">WhatsApp is not available.</p>
            <p className="text-xs text-amber-600 mt-0.5">WhatsApp messaging is currently unavailable. Please contact SnapQuote support.</p>
          </div>
        </div>
      )}
      {waSendStatus === 'invalid_number' && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">No client phone number — add a phone number to this lead to send via WhatsApp.</p>
        </div>
      )}
      {waSendStatus === 'pdf_upload_failed' && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700 font-medium">WhatsApp could not be sent. Your quotation is saved. Please try again later.</p>
          </div>
        </div>
      )}

      <div className="relative">
        <div className={`flex flex-col gap-4 xl:gap-5 items-start transition-all duration-300 xl:grid xl:grid-cols-[1fr_400px] ${limitReached || isBlocked ? 'pointer-events-none select-none' : ''}`}
          style={limitReached || isBlocked ? { filter: 'blur(4px)', opacity: 0.4 } : undefined}
        >
          {/* Workspace: details + packages + settings */}
          <div className="space-y-4 xl:space-y-5 min-w-0 w-full">
          {/* Details card */}
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card">
            {services.length === 0 && packages.length === 0 && leads.length === 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Add clients and services in their respective pages to use the Quote Builder.</span>
              </div>
            )}
            <LeftPanel
              leads={leads}
              selectedLead={selectedLead}
              onSelect={setSelectedLead}
              events={events}
              onEventsChange={setEvents}
              serviceName={serviceName}
              onServiceNameChange={setServiceName}
              backgroundImageUrl={backgroundImageUrl}
              onBackgroundChange={setBackgroundImageUrl}
              studioId={profile!.studio_id}
              typography={typography}
              onTypographyChange={setTypography}
            />

            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-ink mb-3">
                Design & Options
              </h3>
              <div
                onClick={() => setIncludeSignature(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <span className="text-xs font-medium text-ink">Include customer signature</span>
                <Toggle checked={includeSignature} onChange={setIncludeSignature} size="sm" />
              </div>
              {includeSignature && (
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                  A signature line will appear on the quotation for physical signing by the client.
                </p>
              )}

              <div className="mt-3">
                <div
                  onClick={() => setShowPaymentDetails(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-ink">Show payment details</span>
                  <Toggle checked={showPaymentDetails} onChange={setShowPaymentDetails} size="sm" />
                </div>
                {showPaymentDetails && !studio.payment_details?.account_holder && !studio.payment_details?.upi_id && (
                  <p className="mt-2 text-xs text-amber-600 leading-relaxed">
                    No payment details saved.{' '}
                    <a href="/app/settings?tab=payment" className="underline font-medium">Add them in Settings.</a>
                  </p>
                )}
              </div>

              <div className="mt-3">
                <div
                  onClick={() => setShowWatermark(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-ink">Show watermark</span>
                  <Toggle checked={showWatermark} onChange={setShowWatermark} size="sm" />
                </div>
                {showWatermark && !studio.watermark_url && (
                  <p className="mt-2 text-xs text-amber-600 leading-relaxed">
                    No watermark uploaded.{' '}
                    <a href="/app/settings?tab=branding" className="underline font-medium">Upload in Settings → Branding.</a>
                  </p>
                )}
              </div>

              <div className="mt-3">
                <div
                  onClick={() => setShowPortfolio(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-ink">Show portfolio</span>
                  <Toggle checked={showPortfolio} onChange={setShowPortfolio} size="sm" />
                </div>
                {showPortfolio && (!studio.portfolio_images || studio.portfolio_images.length === 0) && (
                  <p className="mt-2 text-xs text-amber-600 leading-relaxed">
                    No portfolio images uploaded.{' '}
                    <a href="/app/portfolio" className="underline font-medium">Add them in Portfolio.</a>
                  </p>
                )}
              </div>

              {/* Deliverables section */}
              <div className="mt-3">
                <div
                  onClick={() => setShowDeliverables(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-ink">Include deliverables</span>
                  <Toggle checked={showDeliverables} onChange={setShowDeliverables} size="sm" />
                </div>

                {showDeliverables && (
                  <div className="mt-2 space-y-1.5">
                    {/* Mode selector */}
                    {(['default', 'package', 'custom'] as DeliverableMode[]).map(mode => {
                      const labels: Record<DeliverableMode, string> = {
                        default: 'Default deliverables (from Settings)',
                        package: 'Package deliverables',
                        custom: 'Custom deliverables',
                      };
                      const isAvailable = mode !== 'package' || hasSelectedPackages;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => isAvailable && setDeliverableMode(mode)}
                          disabled={!isAvailable}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors ${
                            deliverableMode === mode
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : isAvailable
                                ? 'border-border bg-surface hover:bg-surface-raised text-ink'
                                : 'border-border bg-surface opacity-40 cursor-not-allowed text-ink-muted'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            deliverableMode === mode ? 'border-primary-600 bg-primary-600' : 'border-ink-subtle'
                          }`}>
                            {deliverableMode === mode && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </span>
                          <span className="text-xs font-medium">{labels[mode]}</span>
                          {mode === 'package' && !hasSelectedPackages && (
                            <span className="text-[10px] text-ink-subtle ml-auto">(select a package first)</span>
                          )}
                          {mode === 'package' && hasSelectedPackages && (
                            <span className="text-[10px] text-emerald-600 ml-auto">
                              {packageDeliverables.reduce((n, p) => n + p.deliverables.length, 0)} items
                            </span>
                          )}
                          {mode === 'default' && studio.default_deliverables && studio.default_deliverables.length > 0 && (
                            <span className="text-[10px] text-emerald-600 ml-auto">
                              {studio.default_deliverables.length} items
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Warnings + previews */}
                    {deliverableMode === 'default' && studio.default_deliverables && studio.default_deliverables.length > 0 && (
                      <div className="bg-surface-raised border border-border rounded-lg px-3 py-2 space-y-1">
                        {studio.default_deliverables.map((d, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-ink-subtle text-xs shrink-0 mt-0.5">◆</span>
                            <span className="text-xs text-ink-muted">{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {deliverableMode === 'default' && (!studio.default_deliverables || studio.default_deliverables.length === 0) && (
                      <p className="text-xs text-amber-600 leading-relaxed px-1">
                        No default deliverables set.{' '}
                        <a href="/app/settings?tab=studio" className="underline font-medium">Add them in Studio Profile.</a>
                      </p>
                    )}
                    {deliverableMode === 'package' && packageDeliverables.length > 0 && (
                      <div className="space-y-2">
                        {packageDeliverables.map(pkg => (
                          <div key={pkg.packageId} className="bg-surface-raised border border-border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                              <span className="text-xs font-semibold text-ink">{pkg.packageName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPkg({ packageId: pkg.packageId, packageName: pkg.packageName, deliverables: [...pkg.deliverables], terms: packageTerms[pkg.packageId] ?? '' });
                                  setEditingPkgInput('');
                                  setEditingPkgBulk('');
                                }}
                                className="flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                            <div className="px-3 py-2 space-y-1">
                              {pkg.deliverables.length === 0 ? (
                                <p className="text-xs text-ink-subtle italic">No deliverables — click Edit to add.</p>
                              ) : pkg.deliverables.map((d, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="text-ink-subtle text-xs shrink-0 mt-0.5">◆</span>
                                  <span className="text-xs text-ink-muted">{d}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Custom deliverables editor */}
                    {deliverableMode === 'custom' && (
                      <div className="mt-2 space-y-2">
                        {customDeliverables.length > 0 && (
                          <div className="bg-surface-raised border border-border rounded-lg divide-y divide-border overflow-hidden">
                            {customDeliverables.map((d, i) => (
                              <div key={i} className="flex items-start gap-2 px-3 py-2">
                                <span className="text-ink-subtle mt-1 text-xs shrink-0">◆</span>
                                <input
                                  type="text"
                                  value={d}
                                  onChange={e => {
                                    const updated = [...customDeliverables];
                                    updated[i] = e.target.value;
                                    setCustomDeliverables(updated);
                                  }}
                                  className="flex-1 bg-transparent text-xs text-ink outline-none min-w-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => setCustomDeliverables(prev => prev.filter((_, idx) => idx !== i))}
                                  className="w-5 h-5 flex items-center justify-center rounded text-ink-subtle hover:text-danger transition-colors shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add a deliverable..."
                            value={customDeliverableInput}
                            onChange={e => setCustomDeliverableInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const v = customDeliverableInput.trim();
                                if (v) { setCustomDeliverables(prev => [...prev, v]); setCustomDeliverableInput(''); }
                              }
                            }}
                            className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const v = customDeliverableInput.trim();
                              if (v) { setCustomDeliverables(prev => [...prev, v]); setCustomDeliverableInput(''); }
                            }}
                            disabled={!customDeliverableInput.trim()}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold transition-colors shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Conditions section */}
            <div className="mt-5 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-ink mb-3">
                Terms &amp; Conditions
              </h3>

              {/* Default T&C toggle */}
              <div
                onClick={() => setShowDefaultTerms(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <span className="text-xs font-medium text-ink">Include default terms &amp; conditions</span>
                <Toggle checked={showDefaultTerms} onChange={setShowDefaultTerms} size="sm" />
              </div>
              {showDefaultTerms && !studio.terms_and_conditions && (
                <p className="mt-2 text-xs text-amber-600 leading-relaxed">
                  No default terms saved.{' '}
                  <a href="/app/settings?tab=studio" className="underline font-medium">Add them in Studio Profile.</a>
                </p>
              )}

              {/* Additional T&C toggle + editor */}
              <div className="mt-3">
                <div
                  onClick={() => setShowAdditionalTerms(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-ink">Include additional terms &amp; conditions</span>
                  <Toggle checked={showAdditionalTerms} onChange={setShowAdditionalTerms} size="sm" />
                </div>

                {showAdditionalTerms && (
                  <div className="mt-3 space-y-2">
                    {/* Existing terms list */}
                    {additionalTerms.length > 0 && (
                      <div className="bg-surface-raised border border-border rounded-lg divide-y divide-border overflow-hidden">
                        {additionalTerms.map((term, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2">
                            <span className="text-ink-subtle mt-1 text-xs shrink-0">•</span>
                            <input
                              type="text"
                              value={term}
                              onChange={e => {
                                const updated = [...additionalTerms];
                                updated[i] = e.target.value;
                                setAdditionalTerms(updated);
                              }}
                              className="flex-1 bg-transparent text-xs text-ink outline-none min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() => setAdditionalTerms(prev => prev.filter((_, idx) => idx !== i))}
                              className="w-5 h-5 flex items-center justify-center rounded text-ink-subtle hover:text-danger transition-colors shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Point-by-point input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add a term point..."
                        value={additionalTermsInput}
                        onChange={e => setAdditionalTermsInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const t = additionalTermsInput.trim();
                            if (t) { setAdditionalTerms(prev => [...prev, t]); setAdditionalTermsInput(''); }
                          }
                        }}
                        className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const t = additionalTermsInput.trim();
                          if (t) { setAdditionalTerms(prev => [...prev, t]); setAdditionalTermsInput(''); }
                        }}
                        disabled={!additionalTermsInput.trim()}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>

                    {/* Bulk paste textarea */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-ink-subtle">Or paste complete terms below:</p>
                      <textarea
                        placeholder="Paste full terms and conditions text here..."
                        value={additionalTermsBulkInput}
                        onChange={e => setAdditionalTermsBulkInput(e.target.value)}
                        rows={4}
                        className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const lines = additionalTermsBulkInput
                            .split('\n')
                            .map(l => l.trim())
                            .filter(Boolean);
                          if (lines.length > 0) {
                            setAdditionalTerms(prev => [...prev, ...lines]);
                            setAdditionalTermsBulkInput('');
                          }
                        }}
                        disabled={!additionalTermsBulkInput.trim()}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Import as points
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Packages & Services card */}
          <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-card">
            <MiddlePanel
              services={services}
              packages={packages}
              items={items}
              onItemsChange={setItems}
              finalPrice={finalPrice}
              onFinalPriceChange={setFinalPrice}
              showDiscount={showDiscount}
              onToggleDiscount={() => setShowDiscount(p => !p)}
              includeGst={includeGst}
              onToggleGst={() => setIncludeGst(p => !p)}
              plan={quota?.plan ?? 'trial'}
            />
          </div>
          </div>

          {/* Live Preview */}
          <div className="xl:sticky xl:top-24 min-w-0 w-full overflow-hidden">
            <RightPanel
              studio={studio}
              lead={selectedLead}
              items={items}
              finalPrice={finalPrice}
              showDiscount={showDiscount}
              quoteNumber={quoteNumber}
              themeId={themeId}
              quoteOptions={quoteOptions}
              onOpenFullPreview={() => setShowFullPreview(true)}
              visible={true}
            />
          </div>
        </div>

        {(limitReached || isBlocked) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white border border-border rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 max-w-md w-full mx-4 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-ink">
                  {isTrial ? 'Free Trial Limit Reached' : 'Monthly Quote Limit Reached'}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {isTrial
                    ? 'You have used all 10 quotes included in your free trial. Upgrade to a paid plan to continue building and sending quotes without any limits.'
                    : 'You have reached your monthly quote limit for the current plan. Upgrade to a higher plan to continue creating quotes this month.'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-subtle bg-surface-raised rounded-lg px-4 py-2.5 border border-border w-full justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Unlock unlimited quotes, priority support, and more</span>
              </div>
              <a
                href="/app/settings?tab=billing"
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm w-full justify-center"
              >
                <ArrowUpCircle className="w-4 h-4" />
                View Upgrade Options
              </a>
              <p className="text-xs text-ink-subtle">
                No commitment required &mdash; cancel anytime
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '794px',
          opacity: 0,
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <QuoteDocument
          ref={docRef}
          studio={studio}
          lead={selectedLead}
          items={items}
          finalPrice={finalPrice}
          showDiscount={showDiscount}
          quoteNumber={quoteNumber}
          themeId={themeId}
          quoteOptions={quoteOptions}
        />
      </div>

      {isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {isDirty && !saved ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
                  <span className="text-sm text-ink-muted hidden sm:inline">You have unsaved changes</span>
                </>
              ) : saved ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-sm text-emerald-700 font-medium hidden sm:inline">All changes saved</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-sm text-ink-subtle hidden sm:inline">No unsaved changes</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => safeNavigate('/app/quotes')}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink rounded-lg hover:bg-surface-raised transition-colors"
              >
                <span className="hidden sm:inline">Back to Quotes</span>
                <ArrowLeft className="w-4 h-4 sm:hidden" />
              </button>
              <Button
                size="sm"
                icon={saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                loading={saving}
                onClick={handleSaveOnly}
                disabled={!isDirty && !saving}
                className={saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
              >
                {saved ? 'Saved' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing navigation block toast */}
      {guard.processing && pendingNav && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2.5 bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 max-w-[90vw]">
          <Loader2 className="w-4 h-4 text-indigo-300 animate-spin shrink-0" />
          <p className="text-sm font-medium">Your quotation is still being processed. Please wait until it finishes.</p>
          <button
            onClick={() => guard.setPendingNav(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {pendingNav && !guard.processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink">Unsaved changes</h3>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                  {isEditMode
                    ? 'You have unsaved changes in this quote. Do you want to save before leaving?'
                    : 'You have unsaved data in this quote. Your draft is saved locally and will be restored when you return.'}
                </p>
              </div>
              <button
                onClick={() => guard.setPendingNav(null)}
                className="ml-auto p-1 rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2">
              {isEditMode && (
                <Button
                  size="sm"
                  icon={<Save className="w-3.5 h-3.5" />}
                  loading={saving}
                  onClick={async () => {
                    await handleSaveOnly();
                    const dest = pendingNav;
                    guard.setPendingNav(null);
                    guard.setDirty(false);
                    if (guard.onConfirmLeave.current) {
                      guard.onConfirmLeave.current(dest);
                    } else {
                      navigate(dest);
                    }
                  }}
                  className="w-full justify-center"
                >
                  Save & Leave
                </Button>
              )}
              <button
                onClick={() => {
                  const dest = pendingNav;
                  guard.setPendingNav(null);
                  guard.setDirty(false);
                  setIsDirty(false);
                  if (guard.onConfirmLeave.current) {
                    guard.onConfirmLeave.current(dest);
                  } else {
                    navigate(dest);
                  }
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEditMode
                    ? 'text-red-600 hover:bg-red-50 border border-red-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white rounded-lg'
                }`}
              >
                {isEditMode ? 'Leave without saving' : 'Leave (draft saved)'}
              </button>
              <button
                onClick={() => guard.setPendingNav(null)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors"
              >
                Stay and continue editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Deliverables & Terms modal */}
      {editingPkg && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setEditingPkg(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md flex flex-col overflow-hidden max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-ink">Edit Package</h3>
                <p className="text-xs text-ink-muted mt-0.5">{editingPkg.packageName} — for this quote only</p>
              </div>
              <button
                onClick={() => setEditingPkg(null)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Deliverables section */}
              <div>
                <h4 className="text-xs font-semibold text-ink-subtle uppercase tracking-widest mb-2">Deliverables</h4>
                {editingPkg.deliverables.length === 0 && (
                  <p className="text-xs text-ink-subtle text-center py-3">No deliverables yet. Add below or paste a list.</p>
                )}
                <div className="space-y-1">
                  {editingPkg.deliverables.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-raised border border-border rounded-lg">
                      <span className="text-ink-subtle text-xs shrink-0">◆</span>
                      <input
                        type="text"
                        value={d}
                        onChange={e => {
                          const updated = [...editingPkg.deliverables];
                          updated[i] = e.target.value;
                          setEditingPkg(prev => prev ? { ...prev, deliverables: updated } : null);
                        }}
                        className="flex-1 bg-transparent text-xs text-ink outline-none min-w-0"
                        placeholder="Deliverable description..."
                      />
                      <button
                        type="button"
                        onClick={() => setEditingPkg(prev => prev ? { ...prev, deliverables: prev.deliverables.filter((_, idx) => idx !== i) } : null)}
                        className="w-5 h-5 flex items-center justify-center rounded text-ink-subtle hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Single add */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Add a deliverable..."
                    value={editingPkgInput}
                    onChange={e => setEditingPkgInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = editingPkgInput.trim();
                        if (v) {
                          setEditingPkg(prev => prev ? { ...prev, deliverables: [...prev.deliverables, v] } : null);
                          setEditingPkgInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-xs text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                  />
                  <button
                    type="button"
                    disabled={!editingPkgInput.trim()}
                    onClick={() => {
                      const v = editingPkgInput.trim();
                      if (v) {
                        setEditingPkg(prev => prev ? { ...prev, deliverables: [...prev.deliverables, v] } : null);
                        setEditingPkgInput('');
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold transition-colors shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>

                {/* Bulk paste */}
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-ink-subtle">Or paste deliverables below — one per line:</p>
                  <textarea
                    placeholder="Paste deliverables here...&#10;Responsive website design&#10;5 website pages&#10;Contact form&#10;WhatsApp integration"
                    value={editingPkgBulk}
                    onChange={e => setEditingPkgBulk(e.target.value)}
                    rows={5}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const lines = editingPkgBulk
                        .split('\n')
                        .map(l => l.replace(/^[\s•·\-*]\s*/, '').trim())
                        .filter(Boolean);
                      if (lines.length > 0) {
                        setEditingPkg(prev => prev ? { ...prev, deliverables: [...prev.deliverables, ...lines] } : null);
                        setEditingPkgBulk('');
                      }
                    }}
                    disabled={!editingPkgBulk.trim()}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Import as deliverables
                  </button>
                </div>
              </div>

              {/* Terms & Conditions section */}
              <div className="pt-3 border-t border-border">
                <h4 className="text-xs font-semibold text-ink-subtle uppercase tracking-widest mb-2">Terms &amp; Conditions</h4>
                <p className="text-[10px] text-ink-subtle mb-1.5">Specific to this package. Leave empty if not needed.</p>
                <textarea
                  placeholder="Enter package-specific terms...&#10;50% advance payment required.&#10;Remaining 50% before deployment.&#10;Hosting not included."
                  value={editingPkg.terms}
                  onChange={e => setEditingPkg(prev => prev ? { ...prev, terms: e.target.value } : null)}
                  rows={5}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all resize-none"
                />
              </div>
            </div>

            <div className="px-5 pb-4 pt-3 shrink-0 border-t border-border">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPkg(null)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-xs font-medium text-ink-muted hover:bg-surface-raised transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingPkg) return;
                    setPackageDeliverableOverrides(prev => ({ ...prev, [editingPkg.packageId]: editingPkg.deliverables }));
                    setPackageTerms(prev => {
                      const updated = { ...prev };
                      if (editingPkg.terms.trim()) {
                        updated[editingPkg.packageId] = editingPkg.terms;
                      } else {
                        delete updated[editingPkg.packageId];
                      }
                      return updated;
                    });
                    setEditingPkg(null);
                    setEditingPkgInput('');
                    setEditingPkgBulk('');
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Full-screen quote preview modal */}
      {showFullPreview && createPortal(
        <FullPreviewModal
          quoteNumber={quoteNumber}
          onClose={() => setShowFullPreview(false)}
        >
          <QuoteDocument
            studio={studio}
            lead={selectedLead}
            items={items}
            finalPrice={finalPrice}
            showDiscount={showDiscount}
            quoteNumber={quoteNumber}
            themeId={themeId}
            quoteOptions={quoteOptions}
          />
        </FullPreviewModal>,
        document.body,
      )}

      {/* Save & Send progress modal */}
      {sendStage !== 'idle' && (
        <SendProgressModal
          stage={sendStage}
          errorMessage={sendErrorMessage}
          successMessage={sendSuccessMessage}
          onDismiss={dismissSendModal}
        />
      )}
    </div>
  );
}
