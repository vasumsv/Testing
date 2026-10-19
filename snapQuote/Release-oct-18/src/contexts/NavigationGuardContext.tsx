import { createContext, useContext, useRef, useState, ReactNode } from 'react';

interface NavigationGuardContextValue {
  setDirty: (dirty: boolean) => void;
  isDirty: () => boolean;
  pendingNav: string | null;
  setPendingNav: (path: string | null) => void;
  onConfirmLeave: React.MutableRefObject<((path: string) => void) | null>;
  /** When true, all internal navigation is blocked (e.g. during Save & Send). */
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  isProcessing: () => boolean;
}

const NavigationGuardContext = createContext<NavigationGuardContextValue | null>(null);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef(false);
  const processingRef = useRef(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [processing, setProcessingState] = useState(false);
  const onConfirmLeave = useRef<((path: string) => void) | null>(null);

  function setDirty(dirty: boolean) {
    dirtyRef.current = dirty;
  }

  function isDirty() {
    return dirtyRef.current;
  }

  function setProcessing(p: boolean) {
    processingRef.current = p;
    setProcessingState(p);
  }

  function isProcessing() {
    return processingRef.current;
  }

  return (
    <NavigationGuardContext.Provider value={{ setDirty, isDirty, pendingNav, setPendingNav, onConfirmLeave, processing, setProcessing, isProcessing }}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const ctx = useContext(NavigationGuardContext);
  if (!ctx) throw new Error('useNavigationGuard must be used inside NavigationGuardProvider');
  return ctx;
}
