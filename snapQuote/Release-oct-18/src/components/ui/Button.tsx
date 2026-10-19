import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-900',
  secondary:
    'bg-white text-ink border border-border hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100',
  ghost:
    'text-ink-muted hover:bg-slate-100 hover:text-ink border border-transparent',
  danger:
    'bg-danger text-white hover:bg-red-600 active:bg-red-700 border border-red-700/10',
  outline:
    'border border-border text-ink hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[0.8125rem] gap-1.5 rounded-md',
  md: 'h-11 px-4 text-sm gap-1.5 rounded-md',
  lg: 'h-12 px-5 text-sm gap-2 rounded-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium tracking-tight transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
