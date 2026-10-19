import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export type SendStage = 'idle' | 'saving' | 'preparing_pdf' | 'sending_whatsapp' | 'confirming' | 'success' | 'error';

const STAGE_LABELS: { stage: SendStage; label: string }[] = [
  { stage: 'saving', label: 'Saving your quotation...' },
  { stage: 'preparing_pdf', label: 'Preparing your PDF...' },
  { stage: 'sending_whatsapp', label: 'Sending quotation via WhatsApp...' },
  { stage: 'confirming', label: 'Confirming delivery...' },
];

const STAGE_ORDER: SendStage[] = ['saving', 'preparing_pdf', 'sending_whatsapp', 'confirming'];

interface SendProgressModalProps {
  stage: SendStage;
  errorMessage?: string | null;
  successMessage?: string | null;
  onDismiss: () => void;
}

export function SendProgressModal({ stage, errorMessage, successMessage, onDismiss }: SendProgressModalProps) {
  const isError = stage === 'error';
  const isSuccess = stage === 'success';
  const currentIndex = STAGE_ORDER.indexOf(stage);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
        style={{ animation: 'scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />

        <div className="px-7 py-7">
          {/* Icon + heading */}
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
              isError
                ? 'bg-red-50 border border-red-200'
                : isSuccess
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-indigo-500/20'
            }`}>
              {isError ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900 leading-tight">
                {isError
                  ? 'Sending Failed'
                  : isSuccess
                    ? 'Quotation Sent!'
                    : 'Sending Your Quotation'}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5 leading-snug">
                {isError
                  ? 'Some steps could not be completed.'
                  : isSuccess
                    ? successMessage || 'Your quotation has been sent to your client via WhatsApp.'
                    : 'Please wait while we prepare your quotation and send it to your client via WhatsApp.'}
              </p>
            </div>
          </div>

          {/* Stage list — only show during processing and success */}
          {!isError && (
            <div className="space-y-1.5">
              {STAGE_LABELS.map((item, i) => {
                const isPast = isSuccess || (currentIndex > -1 && i < currentIndex);
                const isActive = !isSuccess && stage === item.stage;
                const isUpcoming = !isPast && !isActive;
                const isConfirmingStage = item.stage === 'confirming';

                // Hide "Confirming delivery" if we never entered that stage
                if (isConfirmingStage && currentIndex < STAGE_ORDER.indexOf('confirming') && !isSuccess) {
                  return null;
                }

                return (
                  <div
                    key={item.stage}
                    className="flex items-center gap-3 py-1.5"
                    style={isActive ? { animation: 'slideIn 0.3s ease-out' } : undefined}
                  >
                    <div className="shrink-0">
                      {isPast ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isUpcoming ? 'border-slate-200' : ''
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}
                    </div>
                    <span className={`text-sm transition-colors duration-200 ${
                      isPast
                        ? 'text-slate-400 line-through decoration-slate-200'
                        : isActive
                          ? 'text-slate-900 font-medium'
                          : 'text-slate-400'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error detail */}
          {isError && errorMessage && (
            <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-700 leading-relaxed">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Action button — only for terminal states */}
        {(isError || isSuccess) && (
          <div className="px-7 pb-6">
            <button
              onClick={onDismiss}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isError
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isError ? 'Close' : 'Done'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
