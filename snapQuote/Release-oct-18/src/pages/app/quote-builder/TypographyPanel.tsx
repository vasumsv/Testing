import { useState, useRef, useEffect } from 'react';
import { Type, Minus, Plus, RotateCcw, Check, ChevronDown } from 'lucide-react';
import { TypographyConfig, FONT_OPTIONS, PRESET_COLORS, DEFAULT_TYPOGRAPHY, MIN_FONT_SIZE, MAX_FONT_SIZE } from './types';

interface Props {
  typography: TypographyConfig | undefined;
  onChange: (typography: TypographyConfig | undefined) => void;
}

export function TypographyPanel({ typography, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [fontDropdown, setFontDropdown] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);

  const current = typography ?? DEFAULT_TYPOGRAPHY;
  const isCustom = !!typography;

  useEffect(() => {
    setHexInput(current.textColor);
  }, [current.textColor]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!fontDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setFontDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fontDropdown]);

  function update(partial: Partial<TypographyConfig>) {
    onChange({ ...current, ...partial });
  }

  function decreaseSize() {
    const next = Math.max(MIN_FONT_SIZE, current.fontSize - 1);
    update({ fontSize: next });
  }

  function increaseSize() {
    const next = Math.min(MAX_FONT_SIZE, current.fontSize + 1);
    update({ fontSize: next });
  }

  function handleHexChange(value: string) {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      update({ textColor: value });
    }
  }

  function handleHexBlur() {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
      setHexInput(current.textColor);
    }
  }

  function reset() {
    onChange(undefined);
  }

  const selectedFont = FONT_OPTIONS.find(f => f.value === current.fontFamily);

  return (
    <div className="pt-5 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink">Typography</h3>
        {isCustom && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink transition-colors"
            title="Reset to template default"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all ${
          open
            ? 'border-primary-300 bg-primary-50/50'
            : 'border-border bg-surface hover:bg-surface-raised'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Type className="w-4 h-4 text-ink-subtle shrink-0" />
          <span className="text-xs font-medium text-ink truncate">
            {isCustom ? (selectedFont?.label ?? 'Custom') : 'Customize'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-ink-subtle shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div ref={panelRef} className="mt-3 space-y-4 p-3.5 rounded-lg border border-border bg-surface-raised/50">
          {/* Font Family */}
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Font Style</label>
            <div ref={fontRef} className="relative">
              <button
                onClick={() => setFontDropdown(o => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-border rounded-lg text-xs font-medium text-ink hover:border-primary-300 transition-colors"
              >
                <span style={{ fontFamily: current.fontFamily }} className="truncate">
                  {selectedFont?.label ?? 'Select font'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-ink-subtle shrink-0 transition-transform ${fontDropdown ? 'rotate-180' : ''}`} />
              </button>
              {fontDropdown && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-lg py-1">
                  {FONT_OPTIONS.map(font => (
                    <button
                      key={font.value}
                      onClick={() => { update({ fontFamily: font.value }); setFontDropdown(false); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-raised transition-colors ${
                        current.fontFamily === font.value ? 'bg-primary-50/50' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div style={{ fontFamily: font.value }} className="text-sm font-medium text-ink truncate">
                          {font.label}
                        </div>
                        <div style={{ fontFamily: font.value }} className="text-[11px] text-ink-subtle truncate">
                          {font.sample}
                        </div>
                      </div>
                      {current.fontFamily === font.value && (
                        <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Text Size</label>
            <div className="flex items-center gap-2">
              <button
                onClick={decreaseSize}
                disabled={current.fontSize <= MIN_FONT_SIZE}
                aria-label="Decrease font size"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-white text-ink hover:bg-surface-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 text-center text-sm font-semibold text-ink tabular-nums">
                {current.fontSize}px
              </div>
              <button
                onClick={increaseSize}
                disabled={current.fontSize >= MAX_FONT_SIZE}
                aria-label="Increase font size"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-white text-ink hover:bg-surface-raised transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-ink-subtle">Range: {MIN_FONT_SIZE}–{MAX_FONT_SIZE}px</p>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-xs font-medium text-ink-muted block mb-1.5">Text Color</label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <input
                  type="color"
                  value={current.textColor}
                  onChange={e => update({ textColor: e.target.value })}
                  aria-label="Color picker"
                  className="w-9 h-9 rounded-lg border border-border cursor-pointer overflow-hidden"
                />
              </div>
              <input
                type="text"
                value={hexInput}
                onChange={e => handleHexChange(e.target.value)}
                onBlur={handleHexBlur}
                placeholder="#0a0a0a"
                aria-label="Hex color"
                className="flex-1 px-2.5 py-2 bg-white border border-border rounded-lg text-xs font-mono text-ink focus:border-primary-400 focus:ring-1 focus:ring-primary-200 outline-none"
              />
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
              {PRESET_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => { update({ textColor: color.value }); setHexInput(color.value); }}
                  title={color.label}
                  aria-label={color.label}
                  className={`w-full aspect-square rounded-md border-2 transition-all ${
                    current.textColor.toLowerCase() === color.value.toLowerCase()
                      ? 'border-primary-500 ring-1 ring-primary-200'
                      : 'border-border hover:scale-110'
                  }`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
