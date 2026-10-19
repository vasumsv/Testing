import { AlertTriangle, Lock, Clock, ArrowUpCircle, Sparkles } from 'lucide-react';

interface Props {
  plan: string;
  used: number;
  limit: number | null;
  usageText: string;
  usagePercent: number;
  nearLimit: boolean;
  limitReached: boolean;
  expiresAt: string | null;
  isActive: boolean;
  isTrial?: boolean;
  onUpgrade?: () => void;
}

export function QuotaBar({
  plan,
  used,
  limit,
  usageText,
  usagePercent,
  nearLimit,
  limitReached,
  expiresAt,
  isActive,
  isTrial = false,
  onUpgrade,
}: Props) {
  const isUnlimited = limit === null;

  const barColor = limitReached
    ? 'bg-red-500'
    : nearLimit
      ? 'bg-amber-400'
      : isTrial
        ? 'bg-blue-500'
        : 'bg-primary-600';

  const containerClass = limitReached
    ? 'bg-red-50 border-red-200'
    : nearLimit
      ? 'bg-amber-50 border-amber-200'
      : isTrial
        ? 'bg-blue-50 border-blue-200'
        : 'bg-surface border-border';

  const expiringSoon =
    expiresAt && !limitReached
      ? new Date(expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
      : false;

  const expiryFormatted = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className={`rounded-lg border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${containerClass}`}>
      <div className="flex items-center gap-2 shrink-0">
        {(!isActive || limitReached) && <Lock className="w-3.5 h-3.5 text-red-500" />}
        {isActive && !limitReached && nearLimit && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
        {isActive && !limitReached && !nearLimit && isTrial && <Sparkles className="w-3.5 h-3.5 text-blue-500" />}
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${
            limitReached
              ? 'text-red-600'
              : nearLimit
                ? 'text-amber-600'
                : isTrial
                  ? 'text-blue-600'
                  : 'text-ink-muted'
          }`}
        >
          {plan}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {isUnlimited ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">
              {used.toLocaleString()} quotes created this month
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Unlimited
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <span
                className={`text-xs font-medium ${
                  limitReached ? 'text-red-700' : nearLimit ? 'text-amber-700' : isTrial ? 'text-blue-700' : 'text-ink'
                }`}
              >
                {usageText}
              </span>
              <span
                className={`text-xs tabular-nums font-semibold ${
                  limitReached ? 'text-red-600' : nearLimit ? 'text-amber-600' : isTrial ? 'text-blue-600' : 'text-ink-muted'
                }`}
              >
                {usagePercent}%
              </span>
            </div>
            <div className="w-full bg-surface-raised rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </>
        )}

        {limitReached && isTrial && (
          <p className="text-xs text-red-600 font-medium mt-0.5">
            Your free trial is over. Upgrade to continue creating quotes.
          </p>
        )}

        {limitReached && !isTrial && (
          <p className="text-xs text-red-600 font-medium mt-0.5">
            You've reached your monthly limit. Upgrade to continue creating quotes.
          </p>
        )}

        {isActive && nearLimit && !limitReached && isTrial && (
          <p className="text-xs text-amber-600 font-medium mt-0.5">
            Almost out of trial quotes — upgrade before you run out.
          </p>
        )}

        {isActive && nearLimit && !limitReached && !isTrial && (
          <p className="text-xs text-amber-600 font-medium mt-0.5">
            You are close to your limit — consider upgrading before you run out.
          </p>
        )}

        {!isActive && (
          <p className="text-xs text-red-600 font-medium mt-0.5">
            Account is inactive. Please contact support.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {expiryFormatted && (
          <div className={`flex items-center gap-1.5 ${expiringSoon ? 'text-amber-600' : 'text-ink-subtle'}`}>
            <Clock className="w-3 h-3" />
            <span className="text-xs">
              {expiringSoon ? 'Expires ' : 'Valid until '}
              {expiryFormatted}
            </span>
          </div>
        )}

        {onUpgrade && (limitReached || nearLimit || isTrial) && (
          <button
            onClick={onUpgrade}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              limitReached
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                : nearLimit
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            <ArrowUpCircle className="w-3 h-3" />
            {limitReached && isTrial ? 'Upgrade Now' : limitReached ? 'Upgrade Plan' : nearLimit ? 'Upgrade Plan' : 'Upgrade'}
          </button>
        )}
      </div>
    </div>
  );
}
