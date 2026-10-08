import { useCallback, useMemo, useState } from "react";
import classNames from "classnames";
import ToastContext from "./ToastContext";
import type { Toast, ToastProviderProps, ToastType } from "../types/Toast";

// How long a toast stays on screen before it removes itself.
const TOAST_MS = 4000;

const TOAST_STYLES: Record<ToastType, string> = {
  error: "bg-red-900 border-red-700 text-red-200",
  success: "bg-emerald-900 border-emerald-700 text-emerald-200",
  info: "bg-gray-800 border-gray-700 text-gray-200",
};

// Module-level so every toast gets a unique, stable key for its lifetime.
let nextId = 0;

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={classNames(
              "rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              TOAST_STYLES[toast.type],
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
