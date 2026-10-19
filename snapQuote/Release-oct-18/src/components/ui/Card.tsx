import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-border ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}



interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon }: StatCardProps) {
  const changeColor = changeType === 'positive' ? 'text-success' : changeType === 'negative' ? 'text-danger' : 'text-ink-subtle';

  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold text-ink-subtle uppercase tracking-[0.07em]">{label}</p>
          <p className="mt-2.5 text-[1.75rem] font-semibold text-ink leading-none tracking-tight">{value}</p>
          {change && (
            <p className={`mt-2 text-xs font-medium ${changeColor}`}>{change}</p>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          {icon}
        </div>
      </div>
    </div>
  );
}
