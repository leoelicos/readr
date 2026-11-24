import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  tone?: 'info' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  notify(toast: Omit<Toast, 'id'>): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number) => {
      clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
      );
    },
    [dismiss],
  );

  const notify = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = nextId.current++;
      setToasts((all) => [...all.slice(-2), { ...toast, id }]);
      // Toasts with an action (e.g. Undo) stay until dismissed so nobody is rushed (WCAG 2.2.1).
      if (!toast.action) schedule(id);
    },
    [schedule],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext value={value}>
      {children}
      <section className="toasts" aria-label="Notifications">
        <div role="status" aria-live="polite">
          <ol>
            {toasts.map((t) => (
              <li key={t.id} className="toast" data-tone={t.tone ?? 'info'}>
                <p>{t.message}</p>
                {t.action ? (
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                  >
                    {t.action.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(t.id)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
