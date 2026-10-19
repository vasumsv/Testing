import { useState, useEffect, FormEvent } from 'react';
import { Plus, Camera, Pencil, Trash2, Video, Layers, Search, BookOpen, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { supabase } from '../../../lib/supabase';
import { invalidateStudioData } from '../../../lib/studioDataCache';
import { formatCurrencyDecimal } from '../../../lib/currency';
import { useAuth } from '../../../contexts/AuthContext';
import { Service, ServiceCategory } from '../../../types';
import { PREDEFINED_SERVICES, PredefinedService } from './predefinedServices';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  photography: 'Photography',
  videography: 'Videography',
  addon: 'Add-on',
};

const CATEGORY_BADGE: Record<ServiceCategory, 'info' | 'neutral' | 'warning'> = {
  photography: 'info',
  videography: 'neutral',
  addon: 'warning',
};

const CATEGORY_ICON: Record<ServiceCategory, typeof Camera> = {
  photography: Camera,
  videography: Video,
  addon: Layers,
};

interface ServiceForm {
  name: string;
  category: ServiceCategory;
  price: string;
}

const EMPTY_FORM: ServiceForm = { name: '', category: 'photography', price: '' };

function ServiceFormFields({
  form,
  onChange,
}: {
  form: ServiceForm;
  onChange: (f: ServiceForm) => void;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Service Name"
        placeholder="e.g. Full Day Wedding Coverage"
        value={form.name}
        onChange={e => onChange({ ...form, name: e.target.value })}
        required
        autoFocus
      />
      <Select
        label="Category"
        value={form.category}
        onChange={e => onChange({ ...form, category: e.target.value as ServiceCategory })}
        required
      >
        <option value="photography">Photography</option>
        <option value="videography">Videography</option>
        <option value="addon">Add-on</option>
      </Select>
      <Input
        label="Default Price"
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={form.price}
        onChange={e => onChange({ ...form, price: e.target.value })}
        required
        prefix={<span className="text-xs font-medium">₹</span>}
      />
    </div>
  );
}

function DeleteConfirmModal({
  service,
  onConfirm,
  onCancel,
  loading,
}: {
  service: Service;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <Modal open onClose={onCancel} title="Delete Service" width="sm">
      <p className="text-sm text-ink-muted mb-5">
        Are you sure you want to delete{' '}
        <span className="font-semibold text-ink">{service.name}</span>?
        This action cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

function ServiceLibraryModal({
  existingNames,
  onImport,
  onClose,
}: {
  existingNames: Set<string>;
  onImport: (services: PredefinedService[]) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ServiceCategory | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const available = PREDEFINED_SERVICES.filter(s => !existingNames.has(s.name));

  const filtered = available.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || s.category === catFilter;
    return matchSearch && matchCat;
  });

  const groupedFiltered: Record<ServiceCategory, PredefinedService[]> = {
    photography: filtered.filter(s => s.category === 'photography'),
    videography: filtered.filter(s => s.category === 'videography'),
    addon: filtered.filter(s => s.category === 'addon'),
  };

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(prev => {
      const next = new Set(prev);
      filtered.forEach(s => next.add(s.name));
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  async function handleImport() {
    const toImport = PREDEFINED_SERVICES.filter(s => selected.has(s.name));
    if (toImport.length === 0) return;
    setImporting(true);
    await onImport(toImport);
    setImporting(false);
  }

  const catCounts: Record<string, number> = { all: available.length };
  available.forEach(s => { catCounts[s.category] = (catCounts[s.category] ?? 0) + 1; });

  return (
    <Modal open onClose={onClose} title="Service Library" width="lg"
      description="Select from Karnataka photography market services to add to your studio."
    >
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle" />
            <input
              type="text"
              autoFocus
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 h-[38px]">
            {(['all', 'photography', 'videography', 'addon'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-2.5 h-full rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  catFilter === cat
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                <span className={`ml-1 ${catFilter === cat ? 'text-white/70' : 'text-ink-subtle'}`}>
                  {catCounts[cat] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted px-0.5">
          <span>{selected.size} selected</span>
          <div className="flex gap-3">
            <button onClick={selectAllVisible} className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Select all visible ({filtered.length})
            </button>
            {selected.size > 0 && (
              <button onClick={clearAll} className="text-ink-subtle hover:text-ink transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-ink-subtle">
              {available.length === 0
                ? 'All library services are already in your studio.'
                : 'No services match your search.'}
            </div>
          ) : (
            <>
              {(['photography', 'videography', 'addon'] as ServiceCategory[]).map(cat => {
                const group = groupedFiltered[cat];
                if (group.length === 0) return null;
                const CatIcon = CATEGORY_ICON[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-raised border-b border-border sticky top-0">
                      <CatIcon className="w-3.5 h-3.5 text-ink-subtle" />
                      <span className="text-xs font-semibold text-ink-subtle uppercase tracking-wide">
                        {CATEGORY_LABELS[cat]}
                      </span>
                      <span className="text-xs text-ink-subtle">({group.length})</span>
                    </div>
                    {group.map(svc => {
                      const isSelected = selected.has(svc.name);
                      return (
                        <button
                          key={svc.name}
                          type="button"
                          onClick={() => toggle(svc.name)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-0 transition-colors ${
                            isSelected ? 'bg-primary-50/60' : 'hover:bg-surface-raised'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-primary-600 border-primary-600' : 'border-border bg-surface'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-ink'}`}>
                            {svc.name}
                          </span>
                          <span className="text-xs text-ink-muted tabular-nums shrink-0">
                            {formatCurrencyDecimal(svc.suggestedPrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {available.length === 0 && (
          <p className="text-xs text-ink-subtle text-center py-2">
            All library services are already added to your studio.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
        <p className="text-xs text-ink-subtle">
          Prices are Karnataka market suggestions — you can edit after import.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            type="button"
            loading={importing}
            disabled={selected.size === 0}
            onClick={handleImport}
          >
            Import {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Services() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    if (profile?.studio_id) fetchServices();
    else setLoading(false);
  }, [profile?.studio_id]);

  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('studio_id', profile!.studio_id)
      .order('created_at', { ascending: false });
    setServices(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(service: Service) {
    setEditTarget(service);
    setForm({
      name: service.name,
      category: service.category,
      price: String(service.price),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    setSaveError(null);

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      studio_id: profile!.studio_id,
      is_active: true,
    };

    try {
      if (editTarget) {
        const { data, error } = await supabase
          .from('services')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editTarget.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) { setServices(prev => prev.map(s => s.id === data.id ? data : s)); invalidateStudioData(profile!.studio_id, 'services'); }
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) { setServices(prev => [data, ...prev]); invalidateStudioData(profile!.studio_id, 'services'); }
      }
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save service. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('services').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      invalidateStudioData(profile!.studio_id, 'services');
      setDeleteTarget(null);
    } catch {
      // keep modal open on failure
    } finally {
      setDeleting(false);
    }
  }

  async function handleLibraryImport(selected: PredefinedService[]) {
    const rows = selected.map(s => ({
      name: s.name,
      category: s.category,
      price: s.suggestedPrice,
      studio_id: profile!.studio_id,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('services')
      .insert(rows)
      .select();

    if (!error && data) {
      setServices(prev => [...data, ...prev]);
      invalidateStudioData(profile!.studio_id, 'services');
      setLibraryOpen(false);
    }
  }

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const counts: Record<string, number> = { all: services.length };
  services.forEach(s => { counts[s.category] = (counts[s.category] ?? 0) + 1; });

  const existingNames = new Set(services.map(s => s.name));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[1.75rem] font-semibold text-ink tracking-tight">Services</h2>
          <p className="text-sm sm:text-[0.9375rem] text-ink-muted mt-0.5">
            {services.length} service{services.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<BookOpen className="w-4 h-4" />}
            onClick={() => setLibraryOpen(true)}
          >
            <span className="hidden sm:inline">Service Library</span>
          </Button>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
            <span className="hidden sm:inline">Add Custom</span>
          </Button>
        </div>
      </div>

      {services.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">Get started with the Service Library</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Choose from 50+ predefined Karnataka photography services to quickly build your service list. You can customize prices after import.
            </p>
            <button
              onClick={() => setLibraryOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Browse Service Library
            </button>
          </div>
          <button onClick={() => {}} className="text-blue-400 hover:text-blue-600 transition-colors self-start">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search className="w-3.5 h-3.5" />}
          />
        </div>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-md p-1 h-[38px] overflow-x-auto">
          {(['all', 'photography', 'videography', 'addon'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 h-full rounded text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              <span className={`ml-1 ${categoryFilter === cat ? 'text-white/70' : 'text-ink-subtle'}`}>
                {counts[cat] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        services.length === 0 ? (
          <EmptyState
            icon={<Camera className="w-5 h-5" />}
            title="No services yet"
            description="Select services from the library or add a custom service to start building quotes."
            action={{ label: 'Browse Service Library', onClick: () => setLibraryOpen(true) }}
          />
        ) : (
          <EmptyState
            icon={<Search className="w-5 h-5" />}
            title="No results"
            description="No services match your current filters."
          />
        )
      ) : (
        <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-subtle uppercase tracking-wide w-full">
                  Service Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ink-subtle uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">
                  Category
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ink-subtle uppercase tracking-wide whitespace-nowrap">
                  Default Price
                </th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(service => {
                const Icon = CATEGORY_ICON[service.category];
                return (
                  <tr
                    key={service.id}
                    className="border-b border-border last:border-0 hover:bg-[#F1F5FF] transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-primary-600" />
                        </div>
                        <span className="font-medium text-ink">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <Badge variant={CATEGORY_BADGE[service.category]}>
                        {CATEGORY_LABELS[service.category]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                      {formatCurrencyDecimal(Number(service.price))}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(service)}
                          className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(service)}
                          className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-red-50 hover:text-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Service' : 'Add Custom Service'}
        description={
          editTarget
            ? 'Update the details for this service.'
            : 'Define a custom service for your studio.'
        }
      >
        <form onSubmit={handleSave}>
          <ServiceFormFields form={form} onChange={setForm} />
          {saveError && (
            <p className="mt-3 text-xs text-danger bg-red-50 border border-red-100 rounded-md px-3 py-2">{saveError}</p>
          )}
          <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={saving}>
              {editTarget ? 'Save Changes' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {deleteTarget && (
        <DeleteConfirmModal
          service={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {libraryOpen && (
        <ServiceLibraryModal
          existingNames={existingNames}
          onImport={handleLibraryImport}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}
