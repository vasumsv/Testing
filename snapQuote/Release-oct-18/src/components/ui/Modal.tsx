import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

const widthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, description, children, width = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[3px] fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widthStyles[width]} bg-white rounded-xl border border-border shadow-modal zoom-in-95`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex-1 pr-4">
            <h2 className="text-[0.9375rem] font-semibold text-ink tracking-tight leading-snug">{title}</h2>
            {description && (
              <p className="text-[0.8125rem] text-ink-muted mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-ink-subtle hover:bg-slate-100 hover:text-ink transition-colors duration-150 shrink-0 -mt-1.5 -mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
