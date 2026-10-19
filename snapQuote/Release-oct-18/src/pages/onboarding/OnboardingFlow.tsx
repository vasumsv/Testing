import { useState, useRef, ChangeEvent } from 'react';
import {
  Camera, Upload, Phone, Mail, Building2,
  Plus, Trash2, Check, ArrowRight, ArrowLeft,
  Aperture, FileText, ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface StudioForm {
  name: string;
  phone: string;
  email: string;
  logo_url: string;
}

interface ServiceRow {
  id: string;
  name: string;
  price: string;
}

function newService(): ServiceRow {
  return { id: crypto.randomUUID(), name: '', price: '' };
}

const STEP_LABELS = ['Studio', 'Services', 'First Quote'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  done
                    ? 'bg-primary-600 text-white'
                    : active
                    ? 'bg-primary-600 text-white ring-4 ring-primary-600/20'
                    : 'bg-surface-raised border border-border text-ink-subtle'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  active ? 'text-primary-600' : done ? 'text-ink-muted' : 'text-ink-subtle'
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`w-16 h-px mb-5 mx-1 transition-all duration-300 ${
                  done ? 'bg-primary-600' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
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
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('studio-logos').getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-primary-600 bg-surface-raised cursor-pointer transition-all group flex items-center justify-center overflow-hidden"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        ) : value ? (
          <>
            <img src={value} alt="logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-ink-subtle group-hover:text-primary-600 transition-colors">
            <Upload className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Logo</span>
          </div>
        )}
      </div>
      <p className="text-xs text-ink-subtle">Optional · PNG, JPG up to 2 MB</p>
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

function StepStudio({
  form,
  onChange,
  studioId,
  error,
}: {
  form: StudioForm;
  onChange: (f: Partial<StudioForm>) => void;
  studioId: string | null;
  error: string;
}) {
  return (
    <div className="space-y-6">
      <LogoUploader
        value={form.logo_url}
        onChange={(url) => onChange({ logo_url: url })}
        studioId={studioId}
      />
      <div className="space-y-4">
        <Input
          label="Studio Name"
          placeholder="e.g. Luminary Studios"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
          prefix={<Building2 className="w-3.5 h-3.5" />}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          prefix={<Phone className="w-3.5 h-3.5" />}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="hello@yourstudio.com"
          value={form.email}
          onChange={(e) => onChange({ email: e.target.value })}
          required
          prefix={<Mail className="w-3.5 h-3.5" />}
        />
      </div>
      {error && (
        <p className="text-sm text-danger bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}

function StepServices({
  rows,
  onChange,
}: {
  rows: ServiceRow[];
  onChange: (rows: ServiceRow[]) => void;
}) {
  function update(id: string, field: 'name' | 'price', value: string) {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function remove(id: string) {
    if (rows.length === 1) return;
    onChange(rows.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Add 2–3 services you typically offer. You can always add more later.
      </p>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={row.id} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-primary-600">{i + 1}</span>
            </div>
            <input
              className="flex-1 h-11 sm:h-9 bg-white border border-border rounded-md px-3 text-sm text-ink placeholder:text-ink-subtle/60 transition-all outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-500"
              placeholder="Service name (e.g. Wedding Photography)"
              value={row.name}
              onChange={(e) => update(row.id, 'name', e.target.value)}
            />
            <div className="relative w-28 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle text-sm pointer-events-none">₹</span>
              <input
                type="number"
                min="0"
                className="w-full h-11 sm:h-9 bg-white border border-border rounded-md pl-6 pr-3 text-sm text-ink placeholder:text-ink-subtle/60 transition-all outline-none focus:ring-2 focus:ring-primary-600/15 focus:border-primary-500"
                placeholder="Price"
                value={row.price}
                onChange={(e) => update(row.id, 'price', e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(row.id)}
              disabled={rows.length === 1}
              className="w-10 h-10 flex items-center justify-center rounded-md text-ink-subtle hover:text-danger hover:bg-red-50 transition-colors disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {rows.length < 5 && (
        <button
          type="button"
          onClick={() => onChange([...rows, newService()])}
          className="flex items-center gap-2 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another service
        </button>
      )}
    </div>
  );
}

function StepFirstQuote({
  studioName,
  services,
  onGoToBuilder,
}: {
  studioName: string;
  services: ServiceRow[];
  onGoToBuilder: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3.5 flex items-start gap-3">
        <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-ink">
            {studioName || 'Your studio'} is ready!
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            {services.filter(s => s.name.trim()).length > 0
              ? `${services.filter(s => s.name.trim()).length} service${services.filter(s => s.name.trim()).length > 1 ? 's' : ''} added. Your free trial includes 10 quotes.`
              : 'Your studio is set up. Your free trial includes 10 quotes — no payment required.'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-raised border-b border-border flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-ink-muted" />
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Quote Builder Preview</span>
        </div>
        <div className="p-4 space-y-2">
          {services.filter(s => s.name.trim()).slice(0, 3).map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-ink">{s.name}</span>
              <span className="text-sm font-medium text-ink">
                {s.price ? formatCurrency(parseFloat(s.price)) : '—'}
              </span>
            </div>
          ))}
          {services.filter(s => s.name.trim()).length === 0 && (
            <p className="text-sm text-ink-subtle py-2">No services added yet</p>
          )}
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <Button
          size="md"
          onClick={onGoToBuilder}
          icon={<ChevronRight className="w-4 h-4" />}
          className="w-full justify-center"
        >
          Open Quote Builder
        </Button>
        <p className="text-xs text-center text-ink-subtle">
          Download as PDF or send directly via WhatsApp
        </p>
      </div>
    </div>
  );
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [studioId, setStudioId] = useState<string | null>(null);

  const [studio, setStudio] = useState<StudioForm>({
    name: '',
    phone: '',
    email: profile?.email ?? '',
    logo_url: '',
  });
  const [studioError, setStudioError] = useState('');
  const [savingStudio, setSavingStudio] = useState(false);

  const [services, setServices] = useState<ServiceRow[]>([newService(), newService()]);
  const [savingServices, setSavingServices] = useState(false);

  async function handleStudioNext() {
    if (!studio.name.trim()) { setStudioError('Studio name is required.'); return; }
    if (!studio.email.trim()) { setStudioError('Email is required.'); return; }
    setStudioError('');
    setSavingStudio(true);

    const payload = {
      name: studio.name.trim(),
      phone: studio.phone.trim(),
      email: studio.email.trim(),
      logo_url: studio.logo_url,
      plan: 'trial' as const,
      status: 'active' as const,
      updated_at: new Date().toISOString(),
    };

    let sid = studioId;

    if (sid) {
      await supabase.from('studios').update(payload).eq('id', sid);
    } else {
      const { data, error } = await supabase
        .from('studios')
        .insert(payload)
        .select('id')
        .maybeSingle();

      if (error || !data) {
        setStudioError(error?.message ?? 'Failed to save studio.');
        setSavingStudio(false);
        return;
      }

      sid = data.id;
      setStudioId(sid);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ studio_id: sid })
        .eq('id', profile!.id);

      if (profileError) {
        setStudioError(profileError.message ?? 'Failed to link studio to profile.');
        setSavingStudio(false);
        return;
      }

      await refreshProfile();
    }

    setSavingStudio(false);
    setStep(1);
  }

  async function handleServicesNext() {
    const valid = services.filter((s) => s.name.trim() && parseFloat(s.price) > 0);
    if (valid.length === 0) {
      setStep(2);
      return;
    }

    const resolvedStudioId = studioId ?? profile?.studio_id;
    if (!resolvedStudioId) {
      setStep(2);
      return;
    }

    setSavingServices(true);

    const rows = valid.map((s) => ({
      studio_id: resolvedStudioId,
      name: s.name.trim(),
      description: '',
      category: 'photography' as const,
      price: parseFloat(s.price),
      unit: 'session',
      is_active: true,
    }));

    await supabase.from('services').insert(rows);
    setSavingServices(false);
    setStep(2);
  }

  function handleGoToBuilder() {
    onComplete();
    navigate('/app/quote-builder');
  }

  const TOTAL_STEPS = 3;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {step === 0 && (
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <img src="https://raw.githubusercontent.com/vasumsv/Testing/refs/heads/main/snapQuote/snapquote%20logo%20new.png" alt="SnapQuote" className="h-20 w-auto object-contain mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Set up your studio</h1>
            <p className="text-sm text-ink-muted mt-2">
              Complete three steps to start sending professional quotes.
            </p>
          </div>
        )}

        {step > 0 && (
          <div className="text-center mb-7">
            <h2 className="text-xl font-bold text-ink tracking-tight">
              {step === 1 ? 'Add your services' : 'Setup complete'}
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              {step === 1
                ? 'Add the services you offer. You can adjust pricing at any time.'
                : 'Your studio is ready. Open the quote builder to get started.'}
            </p>
          </div>
        )}

        <div className="bg-white border border-border rounded-2xl shadow-elevated overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border flex justify-center">
            <StepIndicator current={step} total={TOTAL_STEPS} />
          </div>

          <div className="px-6 py-6">
            {step === 0 && (
              <StepStudio
                form={studio}
                onChange={(f) => setStudio((prev) => ({ ...prev, ...f }))}
                studioId={studioId}
                error={studioError}
              />
            )}
            {step === 1 && (
              <StepServices rows={services} onChange={setServices} />
            )}
            {step === 2 && (
              <StepFirstQuote
                studioName={studio.name}
                services={services}
                onGoToBuilder={handleGoToBuilder}
              />
            )}
          </div>

          {step < 2 && (
            <div className="px-6 pb-5 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors px-4 py-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step === 0 && (
                <Button
                  size="md"
                  loading={savingStudio}
                  onClick={handleStudioNext}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              )}

              {step === 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm text-ink-muted hover:text-ink transition-colors"
                  >
                    Skip for now
                  </button>
                  <Button
                    size="md"
                    loading={savingServices}
                    onClick={handleServicesNext}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Save & Continue
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-subtle mt-4">
          You can update everything in Settings later
        </p>
      </div>
    </div>
  );
}
