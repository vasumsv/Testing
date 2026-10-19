import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { Plus, Package, Check, Pencil, Trash2, X, Lock, ArrowUpCircle, ClipboardList } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Toggle } from '../../components/ui/Toggle';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { invalidateStudioData } from '../../lib/studioDataCache';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { Package as PkgType, isBusinessPlan } from '../../types';

interface PkgFormData {
  name: string;
  price: string;
  is_active: boolean;
  includes: string[];
  deliverables: string[];
  deliverableInput: string;
}

const EMPTY_FORM: PkgFormData = {
  name: '',
  price: '',
  is_active: true,
  includes: [''],
  deliverables: [],
  deliverableInput: '',
};

interface PackageRow extends PkgType {
  includes?: string[];
  deliverables?: string[];
}

export function Packages() {
  const { profile } = useAuth();
  const { quota } = useSubscription(profile?.studio_id);
  const plan = quota?.plan ?? 'trial';
  const hasAccess = isBusinessPlan(plan);

  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PackageRow | null>(null);
  const [form, setForm] = useState<PkgFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const includesScrollRef = useRef<HTMLDivElement>(null);
  const includesEndRef = useRef<HTMLDivElement>(null);
  const deliverableInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.studio_id) {
      fetchPackages();
    } else {
      setLoading(false);
    }
  }, [profile?.studio_id]);

  async function fetchPackages() {
    setLoading(true);
    const { data } = await supabase
      .from('packages')
      .select('id, studio_id, name, price, is_active, includes, deliverables, created_at, updated_at')
      .eq('studio_id', profile!.studio_id)
      .order('created_at', { ascending: false });
    setPackages(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(pkg: PackageRow) {
    setEditTarget(pkg);
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      is_active: pkg.is_active,
      includes: (pkg.includes && pkg.includes.length > 0) ? pkg.includes : [''],
      deliverables: pkg.deliverables ?? [],
      deliverableInput: '',
    });
    setSaveError(null);
    setModalOpen(true);
  }

  function addInclude() {
    setForm(p => ({ ...p, includes: [...p.includes, ''] }));
    setTimeout(() => {
      includesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  function removeInclude(i: number) {
    setForm(p => ({ ...p, includes: p.includes.filter((_, idx) => idx !== i) }));
  }

  function updateInclude(i: number, val: string) {
    setForm(p => {
      const arr = [...p.includes];
      arr[i] = val;
      return { ...p, includes: arr };
    });
  }

  function addDeliverable() {
    const text = form.deliverableInput.trim();
    if (!text) return;
    setForm(p => ({ ...p, deliverables: [...p.deliverables, text], deliverableInput: '' }));
    deliverableInputRef.current?.focus();
  }

  function removeDeliverable(i: number) {
    setForm(p => ({ ...p, deliverables: p.deliverables.filter((_, idx) => idx !== i) }));
  }

  function updateDeliverable(i: number, val: string) {
    setForm(p => {
      const arr = [...p.deliverables];
      arr[i] = val;
      return { ...p, deliverables: arr };
    });
  }

  function handleDeliverableKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDeliverable();
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    setSaveError(null);

    // If there's pending input in the deliverable field, add it first
    const finalDeliverables = form.deliverableInput.trim()
      ? [...form.deliverables, form.deliverableInput.trim()]
      : form.deliverables;

    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      is_active: form.is_active,
      includes: form.includes.filter(s => s.trim()),
      deliverables: finalDeliverables.filter(s => s.trim()),
      studio_id: profile!.studio_id,
    };

    try {
      if (editTarget) {
        const { data, error } = await supabase
          .from('packages')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editTarget.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) { setPackages(prev => prev.map(p => p.id === data.id ? data : p)); invalidateStudioData(profile!.studio_id, 'packages'); }
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) { setPackages(prev => [data, ...prev]); invalidateStudioData(profile!.studio_id, 'packages'); }
      }
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save package. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('packages').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setPackages(prev => prev.filter(p => p.id !== deleteTarget.id));
      invalidateStudioData(profile!.studio_id, 'packages');
      setDeleteTarget(null);
    } catch {
      // keep modal open on failure
    } finally {
      setDeleting(false);
    }
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Lock className="w-7 h-7 text-slate-400" />
        </div>
        <div className="flex flex-col gap-2 max-w-sm">
          <h2 className="text-xl font-semibold text-ink">Package Templates — Business Feature</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Create reusable packages to quickly add bundled services to any quote. Available on the SnapQuote Business plan.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Included in Business</p>
            {['Package Templates', 'CRM Leads Management', 'All 10 premium themes', 'Discount display in quotes', '100 quotes per month'].map(f => (
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Packages</h2>
          <p className="text-sm sm:text-[0.9375rem] text-ink-muted mt-0.5">Bundle services into ready-made packages for clients</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          <span className="hidden sm:inline">Add Package</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={<Package className="w-5 h-5" />}
          title="No packages yet"
          description="Create a package to bundle your services and simplify client quoting."
          action={{ label: 'Add Package', onClick: openAdd }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {packages.map(pkg => {
            const hasDeliverables = pkg.deliverables && pkg.deliverables.length > 0;
            return (
              <div key={pkg.id} className="bg-surface rounded-lg border border-border shadow-card flex flex-col transition-shadow duration-200 hover:shadow-elevated overflow-hidden">
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-ink-muted" />
                      </div>
                      <h3 className="text-sm font-semibold text-ink">{pkg.name}</h3>
                    </div>
                    <Badge variant={pkg.is_active ? 'success' : 'neutral'}>
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {pkg.includes && pkg.includes.length > 0 && (
                    <ul className="space-y-1.5">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                          <span className="text-xs text-ink-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasDeliverables && (
                    <div className="border-t border-border pt-3 space-y-2">
                      <p className="text-[10px] font-semibold text-ink-subtle uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardList className="w-3 h-3" />
                        Deliverables
                      </p>
                      <ul className="space-y-1">
                        {pkg.deliverables!.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-1.5" />
                            <span className="text-xs text-ink-muted">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                    <div>
                      <span className="text-xl font-bold text-ink">{formatCurrency(Number(pkg.price))}</span>
                      <span className="text-xs text-ink-subtle ml-1">/ package</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(pkg)} className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(pkg)} className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-red-50 hover:text-danger transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        title={editTarget ? 'Edit Package' : 'Add Package'}
        description={editTarget ? 'Update this package.' : 'Create a new service package.'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Package Name"
            placeholder="e.g. Wedding Essential"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
            autoFocus
          />
          <Input
            label="Price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.price}
            onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
            required
            prefix={<span className="text-xs font-medium">₹</span>}
          />

          {/* What's Included */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">What's Included</label>
            <p className="text-xs text-ink-subtle -mt-0.5">Line items shown in the quote pricing table</p>
            <div
              ref={includesScrollRef}
              className="max-h-40 overflow-y-auto space-y-2 pr-1"
              style={{ scrollBehavior: 'smooth' }}
            >
              {form.includes.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Item ${i + 1}`}
                    value={item}
                    onChange={e => updateInclude(i, e.target.value)}
                    className="flex-1 bg-surface border border-border rounded-md px-3 py-1.5 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                  />
                  {form.includes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInclude(i)}
                      className="w-9 h-9 flex items-center justify-center rounded text-ink-subtle hover:text-danger transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div ref={includesEndRef} />
            </div>
            <button
              type="button"
              onClick={addInclude}
              className="self-start text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              + Add item
            </button>
          </div>

          {/* Deliverables */}
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-sm font-medium text-ink">Deliverables</label>
              <p className="text-xs text-ink-subtle mt-0.5">What the client receives — shown as a bullet list in the quote</p>
            </div>

            {/* Added deliverables list */}
            {form.deliverables.length > 0 && (
              <div className="bg-surface-raised border border-border rounded-lg divide-y divide-border overflow-hidden">
                {form.deliverables.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                    <input
                      type="text"
                      value={item}
                      onChange={e => updateDeliverable(i, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-subtle min-w-0"
                      placeholder={`Deliverable ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeDeliverable(i)}
                      className="w-8 h-8 flex items-center justify-center rounded text-ink-subtle hover:text-danger transition-colors shrink-0 p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new deliverable input */}
            <div className="flex items-center gap-2">
              <input
                ref={deliverableInputRef}
                type="text"
                placeholder="e.g. 500 edited photos in high resolution"
                value={form.deliverableInput}
                onChange={e => setForm(p => ({ ...p, deliverableInput: e.target.value }))}
                onKeyDown={handleDeliverableKeyDown}
                className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
              />
              <button
                type="button"
                onClick={addDeliverable}
                disabled={!form.deliverableInput.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            <p className="text-[11px] text-ink-subtle -mt-0.5">Press Enter or click Add to add a point. Optional — leave empty to skip.</p>
          </div>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
            <Toggle checked={form.is_active} onChange={v => setForm(p => ({ ...p, is_active: v }))} size="sm" />
            <span className="text-sm font-medium text-ink">Active (visible in Quote Builder)</span>
          </div>

          {saveError && (
            <p className="text-xs text-danger bg-red-50 border border-red-100 rounded-md px-3 py-2">{saveError}</p>
          )}
          <div className="sticky bottom-0 bg-white flex justify-end gap-2 pt-3 pb-1 border-t border-border mt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => { setModalOpen(false); setEditTarget(null); }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={saving}>
              {editTarget ? 'Save Changes' : 'Add Package'}
            </Button>
          </div>
        </form>
      </Modal>

      {deleteTarget && (
        <Modal open onClose={() => setDeleteTarget(null)} title="Delete Package" width="sm">
          <p className="text-sm text-ink-muted mb-5">
            Are you sure you want to delete <span className="font-semibold text-ink">{deleteTarget.name}</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
