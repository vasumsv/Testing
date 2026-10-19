import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  prefix,
  suffix,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.8125rem] font-medium text-ink leading-none">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 text-ink-subtle pointer-events-none flex items-center">{prefix}</div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-9 bg-white border border-border rounded-md px-3 text-sm text-ink
            placeholder:text-ink-subtle/50
            outline-none
            hover:border-slate-400/50
            transition-[border-color,box-shadow] duration-150
            focus:border-slate-900 focus:[box-shadow:0_0_0_3px_rgba(15,23,42,0.07)]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-raised
            ${error ? 'border-danger focus:border-danger focus:[box-shadow:0_0_0_3px_rgba(239,68,68,0.10)]' : ''}
            ${prefix ? 'pl-9' : ''}
            ${suffix ? 'pr-9' : ''}
            ${className}
          `}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-ink-subtle flex items-center">{suffix}</div>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Select({ label, error, hint, children, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[0.8125rem] font-medium text-ink leading-none">
          {label}
          {props.required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <select
        className={`
          w-full h-11 sm:h-9 bg-white border border-border rounded-md px-3 text-sm text-ink
          outline-none cursor-pointer
          hover:border-slate-400/50
          transition-[border-color,box-shadow] duration-150
          focus:border-slate-900 focus:[box-shadow:0_0_0_3px_rgba(15,23,42,0.07)]
          ${error ? 'border-danger' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-subtle">{hint}</p>}
    </div>
  );
}
