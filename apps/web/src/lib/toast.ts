import { useSyncExternalStore } from "react";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: number;
  variant: ToastVariant;
  message: string;
};

const DURATION_MS: Record<ToastVariant, number> = { success: 4000, info: 4000, error: 7000 };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = (): void => listeners.forEach((listener) => listener());

export const dismissToast = (id: number): void => {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
};

const push = (variant: ToastVariant, message: string): number => {
  const id = nextId++;
  toasts = [...toasts, { id, variant, message }].slice(-4);
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS[variant]);
  return id;
};

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useToasts = (): Toast[] => useSyncExternalStore(subscribe, () => toasts);
