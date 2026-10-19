import { useState, useRef } from 'react';
import { Search, User, Phone, Calendar, Clock, ChevronDown, X, Plus, Trash2, Upload, ImageIcon } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { PhoneInput } from '../../../components/ui/PhoneInput';
import { Button } from '../../../components/ui/Button';
import { Client } from '../../../types';
import { SelectedLead, QuoteEvent, TypographyConfig } from './types';
import { TypographyPanel } from './TypographyPanel';
import { supabase } from '../../../lib/supabase';

interface Props {
  leads: Client[];
  selectedLead: SelectedLead | null;
  onSelect: (lead: SelectedLead | null) => void;
  events: QuoteEvent[];
  onEventsChange: (events: QuoteEvent[]) => void;
  serviceName: string;
  onServiceNameChange: (name: string) => void;
  backgroundImageUrl?: string;
  onBackgroundChange: (url: string | undefined) => void;
  studioId: string;
  typography?: TypographyConfig;
  onTypographyChange: (typography: TypographyConfig | undefined) => void;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatEventDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const min = m === 0 ? '00' : '30';
      times.push(`${hour12}:${min} ${ampm}`);
    }
  }
  return times;
}

export function LeftPanel({ leads, selectedLead, onSelect, events, onEventsChange, serviceName, onServiceNameChange, backgroundImageUrl, onBackgroundChange, studioId, typography, onTypographyChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [quickAdd, setQuickAdd] = useState(false);
  const [qa, setQa] = useState({ full_name: '', phone: '', event_type: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadWarning(null);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PNG or JPG image.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 5 MB.');
      e.target.value = '';
      return;
    }

    const img = new Image();
    img.onload = async () => {
      const ratio = img.width / img.height;
      const a4Ratio = 1 / 1.414;
      const tolerance = 0.1;
      if (Math.abs(ratio - a4Ratio) > tolerance) {
        setUploadWarning('This image does not match the A4 portrait aspect ratio (1:1.414). The background may appear distorted.');
      }

      setUploading(true);
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        const fileName = `${studioId}/quote-bg-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('studio-assets').upload(fileName, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('studio-assets').getPublicUrl(fileName);
        onBackgroundChange(pub.publicUrl);
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };
    img.onerror = () => {
      setUploadError('Could not read the image file. Please try a different file.');
      e.target.value = '';
    };
    img.src = URL.createObjectURL(file);
  }

  async function handleRemove() {
    if (backgroundImageUrl) {
      try {
        const url = new URL(backgroundImageUrl);
        const path = decodeURIComponent(url.pathname.split('/studio-assets/').pop() || '');
        if (path) await supabase.storage.from('studio-assets').remove([path]);
      } catch {}
    }
    onBackgroundChange(undefined);
    setUploadWarning(null);
  }

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return l.full_name.toLowerCase().includes(q) || l.phone?.includes(q) || l.email?.toLowerCase().includes(q);
  });

  function handleSelect(lead: Client) {
    onSelect({
      id: lead.id,
      full_name: lead.full_name,
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      event_type: lead.event_type ?? '',
      event_date: lead.event_date,
    });
    setOpen(false);
    setSearch('');
  }

  function handleQuickAdd() {
    if (!qa.full_name.trim()) return;
    onSelect({
      id: '__quick__',
      full_name: qa.full_name.trim(),
      phone: qa.phone.trim(),
      email: '',
      event_type: qa.event_type.trim(),
      event_date: null,
    });
    setQuickAdd(false);
    setQa({ full_name: '', phone: '', event_type: '' });
    setOpen(false);
  }

  function addEvent() {
    const newEvent: QuoteEvent = { id: `evt-${Date.now()}`, name: '', date: '' };
    onEventsChange([...events, newEvent]);
  }

  function updateEvent(id: string, field: 'name' | 'date' | 'time', value: string) {
    onEventsChange(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  }

  function removeEvent(id: string) {
    onEventsChange(events.filter(e => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">
          Service Details
        </h3>
        <label className="text-xs font-medium text-ink-muted block mb-1.5">
          Service Name
        </label>
        <input
          type="text"
          placeholder="e.g. Wedding, Engagement, Birthday..."
          value={serviceName}
          onChange={e => onServiceNameChange(e.target.value)}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all placeholder:text-ink-subtle"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">
            Client
          </h3>
          <button
            onClick={() => { setOpen(true); setQuickAdd(true); }}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>

        {selectedLead ? (
          <div className="bg-surface border border-border rounded-lg p-4 relative">
            <button
              onClick={() => onSelect(null)}
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-surface-raised hover:text-ink transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary-600">
                  {selectedLead.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{selectedLead.full_name}</p>
                {selectedLead.email && (
                  <p className="text-xs text-ink-muted">{selectedLead.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-ink-muted">
              {selectedLead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{selectedLead.phone}</span>
                </div>
              )}
              {selectedLead.event_type && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{selectedLead.event_type}{selectedLead.event_date ? ` · ${formatDate(selectedLead.event_date)}` : ''}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setOpen(prev => !prev)}
              className="mt-3 text-xs text-primary-600 hover:underline font-medium"
            >
              Change client
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen(prev => !prev)}
            className="w-full flex items-center justify-between gap-2 bg-surface border border-dashed border-border rounded-lg px-4 py-3.5 text-sm text-ink-muted hover:border-primary-400 hover:text-ink hover:bg-surface-raised transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Select a client...</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}

        {open && (
          <div className="mt-2 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden">
            <div className="p-3 border-b border-border">
              <Input
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                prefix={<Search className="w-3.5 h-3.5" />}
                autoFocus
              />
            </div>

            {!quickAdd ? (
              <>
                <div className="max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-ink-subtle px-4 py-3">No clients found.</p>
                  ) : (
                    filtered.map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => handleSelect(lead)}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary-600">
                            {lead.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{lead.full_name}</p>
                          <p className="text-xs text-ink-muted truncate">{lead.phone || lead.email || lead.event_type}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-3 space-y-3">
                <p className="text-xs font-semibold text-ink-subtle uppercase tracking-wide">Quick Add</p>
                <Input
                  placeholder="Full Name *"
                  value={qa.full_name}
                  onChange={e => setQa(p => ({ ...p, full_name: e.target.value }))}
                  autoFocus
                />
                <PhoneInput
                  placeholder="Phone number"
                  value={qa.phone}
                  onChange={phone => setQa(p => ({ ...p, phone }))}
                />
                <Input
                  placeholder="Event Type"
                  value={qa.event_type}
                  onChange={e => setQa(p => ({ ...p, event_type: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleQuickAdd}>Add</Button>
                  <Button size="sm" variant="secondary" onClick={() => setQuickAdd(false)}>Back</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ink">
            Event Details
          </h3>
          <button
            onClick={addEvent}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </button>
        </div>

        {events.length === 0 ? (
          <button
            onClick={addEvent}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 text-xs text-ink-muted hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add first event
          </button>
        ) : (
          <div className="space-y-2">
            {events.map((evt, idx) => (
              <div key={evt.id} className="bg-surface border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wide">Event {idx + 1}</span>
                  <button
                    onClick={() => removeEvent(evt.id)}
                    className="w-8 h-8 flex items-center justify-center rounded text-ink-subtle hover:text-danger hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Event name (e.g. Wedding, Reception)"
                    value={evt.name}
                    onChange={e => updateEvent(evt.id, 'name', e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all placeholder:text-ink-subtle"
                  />
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-subtle pointer-events-none" />
                    <input
                      type="date"
                      value={evt.date}
                      onChange={e => updateEvent(evt.id, 'date', e.target.value)}
                      className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-subtle pointer-events-none" />
                    <select
                      value={evt.time ?? ''}
                      onChange={e => updateEvent(evt.id, 'time', e.target.value)}
                      className="w-full bg-surface-raised border border-border rounded-md pl-8 pr-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all appearance-none"
                    >
                      <option value="">No time</option>
                      {generateTimeOptions().map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {evt.date && (
                    <p className="text-[10px] text-ink-muted">
                      {formatEventDate(evt.date)}{evt.time ? `, ${evt.time}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quote Background */}
      <div className="pt-5 border-t border-border">
        <h3 className="text-sm font-semibold text-ink mb-3">
          Quote Background
        </h3>
        <p className="text-xs text-ink-muted mb-3">Upload an A4 background design for your quotation.</p>

        {backgroundImageUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-border bg-surface-raised">
              <img src={backgroundImageUrl} alt="Background preview" className="w-full max-h-40 object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-ink hover:bg-surface-raised transition-colors disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                Replace
              </button>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-danger hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg px-4 py-6 text-ink-muted hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/30 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
            <span className="text-xs font-medium">{uploading ? 'Uploading...' : 'Upload Background'}</span>
          </button>
        )}

        <p className="mt-2 text-[10px] text-ink-subtle leading-relaxed">
          Recommended: A4 Portrait — 2480 × 3508 px<br />
          PNG or JPG • Maximum 5 MB
        </p>

        {uploadError && (
          <p className="mt-1.5 text-[11px] text-red-600">{uploadError}</p>
        )}
        {uploadWarning && (
          <p className="mt-1.5 text-[11px] text-amber-600">{uploadWarning}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <TypographyPanel typography={typography} onChange={onTypographyChange} />
    </div>
  );
}
