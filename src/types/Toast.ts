import type { ReactNode } from "react";

type ToastType = "error" | "success" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

type ToastProviderProps = { children: ReactNode };

export type { ToastType, Toast, ToastContextValue, ToastProviderProps };
