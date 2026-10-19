import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import {
  Building2, Phone, Mail, MapPin, Globe, Hash,
  Upload, Check, AlertCircle, Camera, User, Plus, X, ClipboardList,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface StudioForm {
  name: string;
  tagline: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  gst_number: string;
  logo_url: string;
  details_section: string;
  terms_and_conditions: string;
  default_deliverables: string[];
}

const EMPTY_FORM: StudioForm = {
  name: '',
  tagline: '',
  owner_name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  gst_number: '',
  logo_url: '',
  details_section: '',
  terms_and_conditions: '',
  default_deliverables: [],
};

function QuotationPreview({ form }: { form: StudioForm }) {
  const hasLogo = Boolean(form.logo_url);
  const hasName = Boolean(form.name.trim());
  const isEmpty = !hasName && !form.phone && !form.email && !form.address;

  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-semibold text-ink-subtle uppercase tracking-widest mb-3">
        Live Preview
      </p>
      <div className="bg-surface border border-border rounded-xl shadow-elevated overflow-hidden flex-1">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 pt-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {hasLogo ? (
                <img
                  src={form.logo_url}
                  alt="Studio logo"
                  className="w-14 h-14 rounded-xl object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className={`text-lg font-bold leading-tight ${hasName ? 'text-white' : 'text-white/30'}`}>
                {hasName ? form.name : 'Your Studio Name'}
              </h2>
              {form.owner_name && (
                <p className="text-sm text-white/60 mt-0.5">{form.owner_name}</p>
              )}
              {form.tagline && (
                <p className="text-xs text-white/50 mt-0.5 italic">{form.tagline}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {isEmpty ? (
            <p className="text-xs text-ink-subtle italic">
              Fill in the form to see your studio branding preview
            </p>
          ) : (
            <>
              {(form.phone || form.email) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {form.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" strokeWidth={1.75} />
                      <span className="text-sm text-ink">{form.phone}</span>
                    </div>
                  )}
                  {form.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" strokeWidth={1.75} />
                      <span className="text-sm text-ink break-all">{form.email}</span>
                    </div>
                  )}
                </div>
              )}

              {form.address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span className="text-sm text-ink whitespace-pre-line">{form.address}</span>
                </div>
              )}

              {(form.website || form.gst_number) && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 border-t border-border">
                  {form.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" strokeWidth={1.75} />
                      <span className="text-sm text-primary-600">
                        {form.website.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  )}
                  {form.gst_number && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" strokeWidth={1.75} />
                      <span className="text-sm text-ink">GST: {form.gst_number}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border px-6 py-3 bg-surface-raised flex items-center justify-between">
          <span className="text-[10px] font-semibold text-ink-subtle uppercase tracking-widest">
            Quotation Header
          </span>
          <span className="text-[10px] text-ink-subtle">SnapQuote</span>
        </div>
      </div>

      <p className="text-xs text-ink-subtle mt-3 text-center">
        This header appears at the top of every quote you send.
      </p>
    </div>
  );
}

function LogoUploader({
  value,
  onChange,
  studioId,
}: {
  value: string;
  onChange: (url: string) => void;
  studioId: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2 MB.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${studioId ?? 'temp'}/logo-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('studio-logos')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      alert('Upload failed: ' + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('studio-logos')
      .getPublicUrl(path);

    onChange(urlData.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">Logo</label>
      <div className="flex items-center gap-4">
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="relative w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary-600 bg-surface-raised cursor-pointer transition-all duration-150 group flex items-center justify-center overflow-hidden"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          ) : value ? (
            <>
              <img src={value} alt="Logo preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-ink-subtle group-hover:text-primary-600 transition-colors">
              <Upload className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[10px] font-medium">Upload</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-ink-muted mb-2">
            Upload your studio logo. It will appear on all quotation documents.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {value ? 'Change Logo' : 'Choose File'}
            </Button>
            {value && !uploading && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onChange('')}
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-subtle mt-1.5">PNG, JPG — max 2 MB</p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export function StudioProfileTab() {
  const { profile } = useAuth();
  const [form, setForm] = useState<StudioForm>(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState<StudioForm>(EMPTY_FORM);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!profile) { setLoading(false); return; }

      if (profile.studio_id) {
        const { data } = await supabase
          .from('studios')
          .select('*')
          .eq('id', profile.studio_id)
          .maybeSingle();

        if (data) {
          setStudioId(data.id);
          const loaded: StudioForm = {
            name: data.name ?? '',
            tagline: data.tagline ?? '',
            owner_name: data.owner_name ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            website: data.website ?? '',
            gst_number: data.gst_number ?? '',
            logo_url: data.logo_url ?? '',
            details_section: data.details_section ?? '',
            terms_and_conditions: data.terms_and_conditions ?? '',
            default_deliverables: Array.isArray(data.default_deliverables) ? data.default_deliverables : [],
          };
          setForm(loaded);
          setOriginalForm(loaded);
        }
      } else {
        const initial: StudioForm = { ...EMPTY_FORM, email: profile.email ?? '' };
        setForm(initial);
        setOriginalForm(initial);
      }

      setLoading(false);
    }
    load();
  }, [profile]);

  const [deliverableInput, setDeliverableInput] = useState('');
  const deliverableInputRef = useRef<HTMLInputElement>(null);

  const isDirty = (() => {
    const a = { ...form, default_deliverables: form.default_deliverables };
    const b = { ...originalForm, default_deliverables: originalForm.default_deliverables };
    return JSON.stringify(a) !== JSON.stringify(b) || deliverableInput.trim().length > 0;
  })();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  function set(field: keyof StudioForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function addDeliverable() {
    const text = deliverableInput.trim();
    if (!text) return;
    setForm(prev => ({ ...prev, default_deliverables: [...prev.default_deliverables, text] }));
    setDeliverableInput('');
    deliverableInputRef.current?.focus();
  }

  function removeDeliverable(i: number) {
    setForm(prev => ({ ...prev, default_deliverables: prev.default_deliverables.filter((_, idx) => idx !== i) }));
  }

  function updateDeliverable(i: number, val: string) {
    setForm(prev => {
      const arr = [...prev.default_deliverables];
      arr[i] = val;
      return { ...prev, default_deliverables: arr };
    });
  }

  function handleDeliverableKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addDeliverable(); }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Studio Name is required.');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address (e.g. hello@yourstudio.com).');
      return;
    }

    setError('');
    setSaving(true);

    const finalDeliverables = deliverableInput.trim()
      ? [...form.default_deliverables, deliverableInput.trim()]
      : form.default_deliverables;

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      owner_name: form.owner_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      website: form.website.trim(),
      gst_number: form.gst_number.trim(),
      logo_url: form.logo_url,
      details_section: form.details_section.trim(),
      terms_and_conditions: form.terms_and_conditions.trim(),
      default_deliverables: finalDeliverables.filter(s => s.trim()),
      updated_at: new Date().toISOString(),
    };

    if (studioId) {
      const { error: err } = await supabase
        .from('studios')
        .update(payload)
        .eq('id', studioId);

      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { data, error: err } = await supabase
        .from('studios')
        .insert({ ...payload, plan: 'starter', status: 'active' })
        .select('id')
        .maybeSingle();

      if (err || !data) { setError(err?.message ?? 'Failed to create studio.'); setSaving(false); return; }

      setStudioId(data.id);

      await supabase
        .from('profiles')
        .update({ studio_id: data.id })
        .eq('id', profile!.id);
    }

    setSaving(false);
    setSavedAt(new Date());
    setOriginalForm({ ...form, default_deliverables: finalDeliverables.filter(s => s.trim()) });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3">
          <Card>
            <h3 className="text-sm font-semibold text-ink mb-5">Studio Information</h3>

            <div className="space-y-5">
              <LogoUploader
                value={form.logo_url}
                onChange={(url) => set('logo_url', url)}
                studioId={studioId}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Studio Name"
                  placeholder="e.g. Luminary Studios"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                />
                <Input
                  label="Tagline"
                  placeholder="e.g. Capturing timeless moments"
                  value={form.tagline}
                  onChange={e => set('tagline', e.target.value)}
                  hint="Optional"
                />
                <Input
                  label="Owner Name"
                  placeholder="e.g. Sarah Connors"
                  value={form.owner_name}
                  onChange={e => set('owner_name', e.target.value)}
                  prefix={<User className="w-3.5 h-3.5" />}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 555 0100"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  prefix={<Phone className="w-3.5 h-3.5" />}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="hello@yourstudio.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                  prefix={<Mail className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink flex items-center gap-1">
                  Address
                </label>
                <textarea
                  rows={3}
                  placeholder={"123 Main Street\nNew York, NY 10001"}
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition-all duration-150 outline-none resize-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Website"
                  type="url"
                  placeholder="https://yourstudio.com"
                  value={form.website}
                  onChange={e => set('website', e.target.value)}
                  prefix={<Globe className="w-3.5 h-3.5" />}
                  hint="Optional"
                />
                <Input
                  label="GST Number"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  value={form.gst_number}
                  onChange={e => set('gst_number', e.target.value)}
                  prefix={<Hash className="w-3.5 h-3.5" />}
                  hint="Optional"
                />
              </div>

              {/* Default Deliverables */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-ink-subtle" />
                    <label className="text-sm font-medium text-ink">Default Deliverables</label>
                  </div>
                  <span className="text-xs text-ink-subtle">Optional — appears on quotations</span>
                </div>
                <p className="text-xs text-ink-muted -mt-0.5">These are your standard deliverables. You can choose to use them, override with package deliverables, or add custom ones per quote in the Quote Builder.</p>

                {form.default_deliverables.length > 0 && (
                  <div className="bg-surface-raised border border-border rounded-lg divide-y divide-border overflow-hidden">
                    {form.default_deliverables.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                        <input
                          type="text"
                          value={item}
                          onChange={e => updateDeliverable(i, e.target.value)}
                          className="flex-1 bg-transparent text-sm text-ink outline-none min-w-0 placeholder:text-ink-subtle"
                          placeholder={`Deliverable ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeDeliverable(i)}
                          className="w-8 h-8 flex items-center justify-center rounded text-ink-subtle hover:text-danger transition-colors shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={deliverableInputRef}
                    type="text"
                    placeholder="e.g. 500 edited photos in high resolution"
                    value={deliverableInput}
                    onChange={e => setDeliverableInput(e.target.value)}
                    onKeyDown={handleDeliverableKeyDown}
                    className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-subtle outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addDeliverable}
                    disabled={!deliverableInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md text-xs font-semibold transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
                <p className="text-[11px] text-ink-subtle">Press Enter or click Add to add a point.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-ink">Terms &amp; Conditions</label>
                  <span className="text-xs text-ink-subtle">Optional — appears on last page of quotation</span>
                </div>
                <textarea
                  rows={8}
                  placeholder={"1. 50% advance required to confirm booking.\n2. Remaining balance due on event day.\n3. Cancellations within 7 days are non-refundable.\n4. Raw files / unedited footage are not provided.\n5. Final delivery within 30 working days."}
                  value={form.terms_and_conditions}
                  onChange={e => set('terms_and_conditions', e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition-all duration-150 outline-none resize-y focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 leading-relaxed"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
              {savedAt ? (
                <div className="flex items-center gap-1.5 text-success">
                  <Check className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : isDirty ? (
                <span className="text-xs text-ink-subtle">Unsaved changes</span>
              ) : (
                <span className="text-xs text-ink-subtle">All changes saved</span>
              )}
              <Button onClick={handleSave} loading={saving} size="sm" disabled={!isDirty || !emailValid}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-2 xl:sticky xl:top-24">
          <QuotationPreview form={form} />
        </div>
      </div>
    </div>
  );
}
