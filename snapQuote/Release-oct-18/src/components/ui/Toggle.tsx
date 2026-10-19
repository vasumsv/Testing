import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const isSm = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      style={{
        // Track
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        width: isSm ? '36px' : '44px',
        height: isSm ? '20px' : '24px',
        borderRadius: '9999px',
        border: checked
          ? '1.5px solid #7c5c2e'
          : '1.5px solid #c4b59a',
        background: checked
          ? 'linear-gradient(135deg, #b07d3a 0%, #8a5e20 60%, #6b4817 100%)'
          : 'linear-gradient(135deg, #f0e8d8 0%, #ddd0b8 60%, #c9b99a 100%)',
        boxShadow: checked
          ? 'inset 0 2px 4px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.12)'
          : 'inset 0 2px 4px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.6)',
        transition: 'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
      }}
      onFocus={e => {
        e.currentTarget.style.boxShadow = checked
          ? 'inset 0 2px 4px rgba(0,0,0,0.35), 0 0 0 3px rgba(176,125,58,0.28)'
          : 'inset 0 2px 4px rgba(0,0,0,0.18), 0 0 0 3px rgba(176,125,58,0.18)';
      }}
      onBlur={e => {
        e.currentTarget.style.boxShadow = checked
          ? 'inset 0 2px 4px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.12)'
          : 'inset 0 2px 4px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.6)';
      }}
    >
      {/* Knob */}
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? (isSm ? '18px' : '22px') : '2px',
          width: isSm ? '14px' : '18px',
          height: isSm ? '14px' : '18px',
          borderRadius: '50%',
          background: checked
            ? 'radial-gradient(circle at 35% 35%, #f5e8ca, #e0c47a 40%, #c9a84c 80%, #b08020)'
            : 'radial-gradient(circle at 35% 35%, #fffdf7, #f0e8d2 45%, #ddd0b4 80%, #c8b898)',
          border: checked
            ? '1px solid #8a6010'
            : '1px solid #a89070',
          boxShadow: checked
            ? '0 1px 3px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,240,0.5)'
            : '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)',
          transition: 'left 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.22s ease, border-color 0.22s ease',
        }}
      >
        {/* Knurl lines */}
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: checked
            ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)'
            : 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 3px)',
        }} />
      </span>

      {/* Tick mark when on */}
      {checked && (
        <span style={{
          position: 'absolute',
          left: isSm ? '5px' : '6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: isSm ? '6px' : '7px',
          height: isSm ? '6px' : '7px',
          opacity: 0.85,
        }}>
          <svg viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4.5L3 6L6.5 2" stroke="rgba(255,240,200,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
