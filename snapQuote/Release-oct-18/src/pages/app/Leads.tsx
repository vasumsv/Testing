import { useState, useEffect, FormEvent } from 'react';
import { Plus, Search, Users, Pencil, Trash2, CalendarDays, MapPin, IndianRupee, Phone, Mail, Lock, ArrowUpCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge, leadStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { Lead, LeadStatus, isBusinessPlan } from '../../types';

const EVENT_TYPES = ['Wedding', 'Engagement', 'Portrait', 'Newborn', 'Corporate', 'Birthday', 'Product', 'Other'];

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'booked', label: 'Booked' },
];

interface LeadForm {
  full_name: string;
  phone: string;
  email: string;
  event_type: string;
  event_date: string;
  location: string;
  budget: string;
  status: LeadStatus;
}

const EMPTY_FORM: LeadForm = {
  full_name: '',
  phone: '',
  email: '',
  event_type: 'Wedding',
  event_date: '',
  location: '',
  budget: '',
  status: 'new',
};

function LeadFormFields({ form, onChange }: { form: LeadForm; onChange: (f: LeadForm) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="col-span-2">
        <Input
          label="Full Name"
          placeholder="e.g. Sarah Johnson"
          value={form.full_name}
          onChange={e => onChange({ ...form, full_name: e.target.value })}
          required
          autoFocus
        />
      </div>
      <Input
        label="Phone"
        type="tel"
        placeholder="+1 555 0100"
        value={form.phone}
        onChange={e => onChange({ ...form, phone: e.target.value })}
        prefix={<Phone className="w-3.5 h-3.5" />}
      />
      <Input
        label="Email"
        type="email"
        placeholder="client@email.com"
        value={form.email}
        onChange={e => onChange({ ...form, email: e.target.value })}
        prefix={<Mail className="w-3.5 h-3.5" />}
      />
      <Select
        label="Event Type"
        value={form.event_type}
        onChange={e => onChange({ ...form, event_type: e.target.value })}
      >
        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </Select>
      <Input
        label="Event Date"
        type="date"
        value={form.event_date}
        onChange={e => onChange({ ...form, event_date: e.target.value })}
        prefix={<CalendarDays className="w-3.5 h-3.5" />}
      />
      <Input
        label="Location"
        placeholder="City or venue"
        value={form.location}
        onChange={e => onChange({ ...form, location: e.target.value })}
        prefix={<MapPin className="w-3.5 h-3.5" />}
      />
      <Input
        label="Budget"
        type="number"
        min="0"
        step="100"
        placeholder="0"
        value={form.budget}
        onChange={e => onChange({ ...form, budget: e.target.value })}
        prefix={<IndianRupee className="w-3.5 h-3.5" />}
      />
      <div className="col-span-2">
        <Select
          label="Status"
          value={form.status}
          onChange={e => onChange({ ...form, status: e.target.value as LeadStatus })}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
    </div>
  );
}

export function Leads() {
  const { profile } = useAuth();
  const { quota } = useSubscription(profile?.studio_id);
  const plan = quota?.plan ?? 'trial';
  const hasAccess = isBusinessPlan(plan);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.studio_id) fetchLeads();
    else setLoading(false);
  }, [profile?.studio_id]);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('id, studio_id, full_name, email, phone, event_type, event_date, location, budget, status, created_at, updated_at')
      .eq('studio_id', profile!.studio_id)
      .order('created_at', { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setForm({
      full_name: lead.full_name,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      event_type: lead.event_type || 'Wedding',
      event_date: lead.event_date ?? '',
      location: lead.location ?? '',
      budget: lead.budget != null ? String(lead.budget) : '',
      status: lead.status,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true);
    setSaveError(null);

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      event_type: form.event_type,
      event_date: form.event_date || null,
      location: form.location.trim(),
      budget: form.budget ? parseFloat(form.budget) : null,
      status: form.status,
      studio_id: profile!.studio_id,
    };

    try {
      if (editTarget) {
        const { data, error } = await supabase
          .from('leads')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editTarget.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) setLeads(prev => prev.map(l => l.id === data.id ? data : l));
      } else {
        const { data, error } = await supabase
          .from('leads')
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) setLeads(prev => [data, ...prev]);
      }
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save lead. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('leads').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setLeads(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep modal open on failure
    } finally {
      setDeleting(false);
    }
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch =
      l.full_name.toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      (l.phone ?? '').includes(q);
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUS_OPTIONS.reduce((acc, o) => {
    acc[o.value] = leads.filter(l => l.status === o.value).length;
    return acc;
  }, {} as Record<string, number>);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatBudget(budget: number | null) {
    if (budget == null) return '—';
    return formatCurrency(Number(budget));
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Lock className="w-7 h-7 text-slate-400" />
        </div>
        <div className="flex flex-col gap-2 max-w-sm">
          <h2 className="text-xl font-semibold text-ink">CRM Leads — Business Feature</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Track enquiries, manage your sales pipeline, and never miss a follow-up. Available on the SnapQuote Business plan.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Included in Business</p>
            {['CRM Leads Management', 'Track enquiry pipeline', 'All 10 premium themes', 'Package templates', 'Discount display in quotes'].map(f => (
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Leads</h2>
          <p className="text-sm sm:text-[0.9375rem] text-ink-muted mt-0.5">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} in your pipeline
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(prev => prev === value ? 'all' : value)}
            className={`text-left p-3.5 rounded-lg border transition-all duration-150 ${
              statusFilter === value
                ? 'border-primary-600 bg-primary-50 shadow-sm'
                : 'border-border bg-surface hover:bg-surface-raised'
            }`}
          >
            <p className={`text-2xl font-bold leading-none ${statusFilter === value ? 'text-primary-600' : 'text-ink'}`}>
              {counts[value] ?? 0}
            </p>
            <p className={`text-xs font-medium mt-1.5 ${statusFilter === value ? 'text-primary-600' : 'text-ink-muted'}`}>
              {label}
            </p>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search className="w-3.5 h-3.5" />}
          />
        </div>
        {statusFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            Clear filter
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        leads.length === 0 ? (
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="No leads yet"
            description="Start adding leads from calls, DMs, and enquiries to track your pipeline."
            action={{ label: 'Add Lead', onClick: openAdd }}
          />
        ) : (
          <EmptyState
            icon={<Search className="w-5 h-5" />}
            title="No results"
            description="No leads match your current search or filter."
          />
        )
      ) : (
        <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  {['Name', 'Phone', 'Email', 'Event', 'Date', 'Location', 'Budget', 'Status', ''].map((col, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-xs font-semibold text-ink-subtle uppercase tracking-wide ${
                        col === 'Budget' ? 'text-right' : col === '' ? 'w-16' : 'text-left'
                      } ${['Phone', 'Email', 'Event', 'Location'].includes(col) ? 'hidden md:table-cell' : ''}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-[#F1F5FF] transition-colors duration-150">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary-600">
                            {lead.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-ink">{lead.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted hidden md:table-cell">{lead.phone || '—'}</td>
                    <td className="px-4 py-3 text-ink-muted hidden md:table-cell">{lead.email || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lead.event_type
                        ? <Badge variant="neutral">{lead.event_type}</Badge>
                        : <span className="text-ink-subtle">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(lead.event_date)}</td>
                    <td className="px-4 py-3 text-ink-muted max-w-[130px] truncate hidden md:table-cell">{lead.location || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">{formatBudget(lead.budget)}</td>
                    <td className="px-4 py-3">{leadStatusBadge(lead.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(lead)}
                          className="w-10 h-10 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(lead)}
                          className="w-10 h-10 flex items-center justify-center rounded-md text-ink-subtle hover:bg-red-50 hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Lead' : 'Add Lead'}
        description={
          editTarget
            ? 'Update the lead details.'
            : 'Enter client details to add them to your pipeline.'
        }
        width="lg"
      >
        <form onSubmit={handleSave}>
          <LeadFormFields form={form} onChange={setForm} />
          {saveError && (
            <p className="mt-3 text-xs text-danger bg-red-50 border border-red-100 rounded-md px-3 py-2">{saveError}</p>
          )}
          <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={saving}>
              {editTarget ? 'Save Changes' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title="Delete Lead" width="sm">
          <p className="text-sm text-ink-muted mb-5">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-ink">{deleteTarget.full_name}</span>?
            This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
