import { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';

export interface QuoteAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function QuoteActionsMenu({ actions }: { actions: QuoteAction[] }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const positionMenu = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = Math.min(actions.length * 40 + 16, 320);
    let left = rect.right - menuWidth;
    let top = rect.bottom + 4;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 4;
    if (top < 8) top = 8;
    setMenuPos({ top, left });
  }, [actions.length]);

  useEffect(() => {
    if (open) {
      positionMenu();
      setFocusedIndex(-1);
    }
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleScroll() {
      positionMenu();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, actions.length - 1);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < actions.length) {
          const action = actions[focusedIndex];
          if (!action.disabled) { setOpen(false); action.onClick(); }
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open, actions, focusedIndex, positionMenu]);

  function handleActionClick(action: QuoteAction) {
    if (action.disabled) return;
    setOpen(false);
    action.onClick();
  }

  // Split actions into normal and destructive
  const normalActions = actions.filter(a => !a.destructive);
  const destructiveActions = actions.filter(a => a.destructive);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors shrink-0 ${
          open ? 'bg-surface-raised text-ink' : 'text-ink-subtle hover:bg-surface-raised hover:text-ink'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && menuPos && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-border py-1.5 w-56"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          {normalActions.map((action, idx) => (
            <button
              key={action.key}
              role="menuitem"
              disabled={action.disabled}
              onClick={() => handleActionClick(action)}
              onMouseEnter={() => setFocusedIndex(idx)}
              onFocus={() => setFocusedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors outline-none ${
                action.disabled
                  ? 'text-ink-subtle/50 cursor-not-allowed'
                  : focusedIndex === idx
                    ? 'bg-surface-raised text-ink'
                    : 'text-ink-muted hover:bg-surface-raised hover:text-ink'
              }`}
            >
              <span className={action.disabled ? 'opacity-40' : ''}>{action.icon}</span>
              <span className="flex-1">{action.label}</span>
              {action.disabled && action.disabledReason && (
                <span className="text-[10px] text-ink-subtle">{action.disabledReason}</span>
              )}
            </button>
          ))}

          {destructiveActions.length > 0 && normalActions.length > 0 && (
            <div className="h-px bg-border my-1 mx-1.5" />
          )}

          {destructiveActions.map((action, idx) => {
            const realIdx = normalActions.length + idx;
            return (
              <button
                key={action.key}
                role="menuitem"
                disabled={action.disabled}
                onClick={() => handleActionClick(action)}
                onMouseEnter={() => setFocusedIndex(realIdx)}
                onFocus={() => setFocusedIndex(realIdx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors outline-none ${
                  action.disabled
                    ? 'text-red-300 cursor-not-allowed'
                    : focusedIndex === realIdx
                      ? 'bg-red-50 text-red-600'
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <span className={action.disabled ? 'opacity-40' : ''}>{action.icon}</span>
                <span className="flex-1">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
