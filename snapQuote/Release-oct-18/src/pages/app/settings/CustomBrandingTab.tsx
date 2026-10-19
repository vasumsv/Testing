import { useState, useEffect, useRef } from 'react';
import { Lock, Palette, Type, Check, AlertCircle, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { supabase } from '../../../lib/supabase';
import { invalidateStudioData } from '../../../lib/studioDataCache';
import { useAuth } from '../../../contexts/AuthContext';
import { useSubscription } from '../../../hooks/useSubscription';
import { isBusinessPlan } from '../../../types';

interface BrandingForm {
  accent_color: string;
  font_preference: string;
  tagline: string;
  footer_text: string;
}

const EMPTY_FORM: BrandingForm = {
  accent_color: '#2563EB',
  font_preference: 'inter',
  tagline: '',
  footer_text: '',
};

function WatermarkSection({ studioId }: { studioId: string }) {
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('studios').select('watermark_url').eq('id', studioId).maybeSingle().then(({ data }) => {
      if (data) setWatermarkUrl((data as any).watermark_url ?? null);
    });
  }, [studioId]);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return; }

    setError('');
    setUploading(true);
    setSaved(false);

    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${studioId}/watermark.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('studio-assets').upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) { setError(uploadErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('studio-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?v=${Date.now()}`;

    const { error: dbErr } = await supabase.from('studios').update({ watermark_url: publicUrl }).eq('id', studioId);
    if (dbErr) { setError(dbErr.message); setUploading(false); return; }

    invalidateStudioData(studioId, 'studio');
    setWatermarkUrl(publicUrl);
    setUploading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleRemove() {
    setRemoving(true);
    setError('');
    await supabase.from('studios').update({ watermark_url: null }).eq('id', studioId);
    invalidateStudioData(studioId, 'studio');
    setWatermarkUrl(null);
    setRemoving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Quotation Watermark</h3>
          <p className="text-xs text-ink-muted mt-1">Displayed centered on every quotation page at light opacity</p>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-success">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Saved</span>
          </div>
        )}
      </div>

      {watermarkUrl ? (
        <div className="space-y-4">
          <div className="relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center" style={{ minHeight: '140px' }}>
            <img
              src={watermarkUrl}
              alt="Watermark preview"
              className="max-h-36 max-w-full object-contain opacity-30"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.02)_6px,rgba(0,0,0,0.02)_12px)]" />
              <span className="relative text-[10px] font-semibold text-slate-400 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full border border-slate-200">
                Preview at opacity
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileRef.current?.click()}
              loading={uploading}
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleRemove}
              loading={removing}
              className="text-danger hover:bg-red-50 border-red-200"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-slate-300 hover:bg-slate-50 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors flex items-center justify-center">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-ink">{uploading ? 'Uploading…' : 'Upload Watermark'}</p>
            <p className="text-xs text-ink-muted mt-0.5">PNG or SVG with transparency recommended · Max 5 MB</p>
          </div>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {error && (
        <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <p className="text-xs text-ink-subtle mt-4 leading-relaxed">
        The watermark appears centered behind content on every quote page. Use a logo or studio mark in PNG/SVG with a transparent background for best results.
      </p>
    </Card>
  );
}

const COLOR_PRESETS = [
  { label: 'Blue', value: '#2563EB' },
  { label: 'Slate', value: '#334155' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Emerald', value: '#059669' },
];

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', preview: 'Clean & Modern' },
  { value: 'georgia', label: 'Georgia', preview: 'Classic & Elegant' },
  { value: 'poppins', label: 'Poppins', preview: 'Friendly & Bold' },
];

function ProGate() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
        <Lock className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-2">Custom Branding</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">
        Customize your quote accent colors, fonts, tagline, and footer text to match your studio's identity — available on the SnapQuote Business plan.
      </p>
      <a
        href="/pricing"
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors duration-150"
      >
        Upgrade to Business
      </a>
    </div>
  );
}

function BrandingPreview({ form }: { form: BrandingForm }) {
  return (
    <div className="flex flex-col h-full">
      <p className="text-xs font-semibold text-ink-subtle uppercase tracking-widest mb-3">
        Quote Preview
      </p>
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1"
        style={{ fontFamily: form.font_preference === 'georgia' ? 'Georgia, serif' : form.font_preference === 'poppins' ? '"Poppins", sans-serif' : 'Inter, sans-serif' }}
      >
        <div
          className="px-6 py-5"
          style={{ background: `linear-gradient(135deg, ${form.accent_color}15 0%, ${form.accent_color}05 100%)`, borderBottom: `3px solid ${form.accent_color}` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: form.accent_color }}>Quotation</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">QT-2025-001</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">Your Studio</p>
              {form.tagline && (
                <p className="text-xs text-slate-400 mt-0.5 italic">{form.tagline}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-xs text-slate-500">Photography Package</span>
            <span className="text-xs font-semibold text-slate-700">₹25,000</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-slate-500">Videography Add-on</span>
            <span className="text-xs font-semibold text-slate-700">₹8,000</span>
          </div>
          <div className="flex justify-between items-center py-3 mt-2 border-t-2" style={{ borderColor: form.accent_color }}>
            <span className="text-sm font-bold text-slate-800">Total</span>
            <span className="text-sm font-bold" style={{ color: form.accent_color }}>₹33,000</span>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            {form.footer_text || 'Thank you for considering us for your special day.'}
          </p>
        </div>
      </div>
      <p className="text-xs text-ink-subtle mt-3 text-center">
        Preview of how your quotes will appear to clients.
      </p>
    </div>
  );
}

export function CustomBrandingTab() {
  const { profile } = useAuth();
  const { quota, loading: subLoading } = useSubscription(profile?.studio_id);
  const [form, setForm] = useState<BrandingForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const hasBusiness = isBusinessPlan(quota?.plan);

  useEffect(() => {
    if (subLoading) return;
    if (!hasBusiness) { setLoading(false); return; }
    loadBranding();
  }, [hasBusiness, subLoading, profile?.studio_id]);

  async function loadBranding() {
    if (!profile?.studio_id) { setLoading(false); return; }
    const { data } = await supabase
      .from('studios')
      .select('accent_color, font_preference, tagline, footer_text')
      .eq('id', profile.studio_id)
      .maybeSingle();

    if (data) {
      setForm({
        accent_color: (data as Record<string, string>).accent_color || EMPTY_FORM.accent_color,
        font_preference: (data as Record<string, string>).font_preference || EMPTY_FORM.font_preference,
        tagline: (data as Record<string, string>).tagline || '',
        footer_text: (data as Record<string, string>).footer_text || '',
      });
    }
    setLoading(false);
  }

  function set(field: keyof BrandingForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSavedAt(null);
  }

  async function handleSave() {
    if (!profile?.studio_id) return;
    setSaving(true);
    setError('');

    const { error: err } = await supabase
      .from('studios')
      .update({
        accent_color: form.accent_color,
        font_preference: form.font_preference,
        tagline: form.tagline.trim(),
        footer_text: form.footer_text.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.studio_id);

    if (err) {
      setError(err.message);
    } else {
      invalidateStudioData(profile.studio_id, 'studio');
      setSavedAt(new Date());
    }
    setSaving(false);
  }

  if (subLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasBusiness) return <ProGate />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3 space-y-5">
          <WatermarkSection studioId={profile!.studio_id!} />
          <Card>
            <h3 className="text-sm font-semibold text-ink mb-5">Brand Identity</h3>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-ink mb-3 block">Accent Color</label>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => set('accent_color', preset.value)}
                      title={preset.label}
                      className="relative w-10 h-10 rounded-lg border-2 transition-all duration-150"
                      style={{
                        backgroundColor: preset.value,
                        borderColor: form.accent_color === preset.value ? preset.value : 'transparent',
                        boxShadow: form.accent_color === preset.value ? `0 0 0 2px white, 0 0 0 4px ${preset.value}` : 'none',
                      }}
                    >
                      {form.accent_color === preset.value && (
                        <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg border border-border shrink-0"
                    style={{ backgroundColor: form.accent_color }}
                  />
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 py-2 flex-1">
                    <Palette className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                    <input
                      type="text"
                      value={form.accent_color}
                      onChange={e => set('accent_color', e.target.value)}
                      placeholder="#2563EB"
                      className="flex-1 bg-transparent text-sm text-ink outline-none font-mono"
                      maxLength={7}
                    />
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={e => set('accent_color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink mb-3 block">Quote Font</label>
                <div className="space-y-2">
                  {FONT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('font_preference', opt.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all duration-150 text-left ${
                        form.font_preference === opt.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-border bg-surface hover:border-primary-300'
                      }`}
                    >
                      <div>
                        <p
                          className="text-sm font-semibold text-ink"
                          style={{ fontFamily: opt.value === 'georgia' ? 'Georgia, serif' : opt.value === 'poppins' ? '"Poppins", sans-serif' : 'Inter, sans-serif' }}
                        >
                          {opt.label}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">{opt.preview}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.font_preference === opt.value ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                      }`}>
                        {form.font_preference === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Studio Tagline"
                  placeholder="e.g. Capturing moments, crafting memories"
                  value={form.tagline}
                  onChange={e => set('tagline', e.target.value)}
                  hint="Shown on quote header next to your studio name"
                  prefix={<Type className="w-3.5 h-3.5" />}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Quote Footer Text</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Thank you for considering us for your special day."
                    value={form.footer_text}
                    onChange={e => set('footer_text', e.target.value)}
                    className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition-all duration-150 outline-none resize-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600"
                  />
                  <p className="text-xs text-ink-subtle">Appears at the bottom of every quote</p>
                </div>
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
              ) : (
                <span className="text-xs text-ink-subtle">Unsaved changes</span>
              )}
              <Button onClick={handleSave} loading={saving} size="sm">
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-2 xl:sticky xl:top-24">
          <BrandingPreview form={form} />
        </div>
      </div>
    </div>
  );
}
