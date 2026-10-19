import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { code: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { code: 'US', dial: '+1',  flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: 'CA', dial: '+1',  flag: '🇨🇦', name: 'Canada' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { code: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { code: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand' },
  { code: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines' },
  { code: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { code: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { code: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Peru' },
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland' },
  { code: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden' },
  { code: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway' },
  { code: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Greece' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Czech Republic' },
  { code: 'HU', dial: '+36', flag: '🇭🇺', name: 'Hungary' },
  { code: 'RO', dial: '+40', flag: '🇷🇴', name: 'Romania' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
];

/** Parse an existing phone string into { country, number } for pre-populating. */
function parsePhone(raw: string): { country: Country; number: string } {
  if (!raw) return { country: COUNTRIES[0], number: '' };
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { country: COUNTRIES[0], number: '' };

  // Try to match a dial code prefix
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    const dialDigits = c.dial.replace(/\D/g, '');
    if (digits.startsWith(dialDigits)) {
      return { country: c, number: digits.slice(dialDigits.length) };
    }
  }
  // If the raw starts with +, keep just the number part after the prefix
  if (raw.startsWith('+')) {
    return { country: COUNTRIES[0], number: digits };
  }
  // No country code detected — assume India (default)
  return { country: COUNTRIES[0], number: digits };
}

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder = 'Phone number', label, className = '' }: PhoneInputProps) {
  const parsed = useMemo(() => parsePhone(value), [value]);
  const [country, setCountry] = useState<Country>(parsed.country);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync internal state when the external value changes (e.g. form reset)
  useEffect(() => {
    const p = parsePhone(value);
    setCountry(p.country);
    setNumber(p.number);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function emit(c: Country, n: string) {
    const clean = n.replace(/\D/g, '');
    onChange(clean ? `${c.dial} ${clean}` : '');
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = e.target.value.replace(/\D/g, '');
    setNumber(clean);
    emit(country, clean);
  }

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setOpen(false);
    setSearch('');
    emit(c, number);
  }

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-[0.8125rem] font-medium text-ink leading-none">{label}</label>
      )}
      <div className="flex items-stretch h-9">
        {/* Country selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 h-full pl-3 pr-2 bg-white border border-border rounded-l-md text-sm text-ink hover:bg-slate-50 transition-colors shrink-0"
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="text-sm font-medium tabular-nums">{country.dial}</span>
            <ChevronDown className="w-3 h-3 text-ink-subtle" />
          </button>

          {open && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-lg shadow-elevated z-50 overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-subtle" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full h-8 bg-slate-50 border border-border rounded-md pl-8 pr-3 text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-slate-900 focus:[box-shadow:0_0_0_3px_rgba(15,23,42,0.07)] transition-all"
                  />
                </div>
              </div>
              <div ref={listRef} className="max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-ink-subtle px-4 py-3">No countries found.</p>
                ) : (
                  filtered.map(c => (
                    <button
                      key={c.code + c.dial}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${c.code === country.code && c.dial === country.dial ? 'bg-primary-50' : ''}`}
                    >
                      <span className="text-base leading-none shrink-0">{c.flag}</span>
                      <span className="flex-1 truncate text-ink">{c.name}</span>
                      <span className="text-xs font-medium text-ink-subtle tabular-nums">{c.dial}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone number input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={placeholder}
          value={number}
          onChange={handleNumberChange}
          className="flex-1 min-w-0 w-full h-full bg-white border border-l-0 border-border rounded-r-md px-3 text-sm text-ink placeholder:text-ink-subtle/50 outline-none hover:border-slate-400/50 transition-[border-color,box-shadow] duration-150 focus:border-slate-900 focus:[box-shadow:0_0_0_3px_rgba(15,23,42,0.07)]"
        />
      </div>
    </div>
  );
}
