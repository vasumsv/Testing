/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        background: '#F8FAFC',
        border: '#E2E8F0',
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          subtle: '#94A3B8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#F8FAFC',
          hover: '#EEF2F8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.9rem' }],
        'xxs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.04)',
        elevated: '0 4px 12px 0 rgba(0,0,0,0.07), 0 1px 3px -1px rgba(0,0,0,0.04)',
        modal: '0 20px 40px -8px rgba(0,0,0,0.14), 0 6px 14px -4px rgba(0,0,0,0.07)',
        'input-focus': '0 0 0 3px rgba(37,99,235,0.1)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
};
