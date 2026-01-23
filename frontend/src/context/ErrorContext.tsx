import React, { createContext, useContext, useState, useCallback } from 'react';
import { type Toast, type ErrorContextType } from '../types/contextTypes';

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const handleError = useCallback((error: unknown, fallbackMessage = 'An unexpected error occurred') => {
    console.error('Error caught:', error);
    
    let message = fallbackMessage;
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    addToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 7000,
    });
  }, [addToast]);

  const handleSuccess = useCallback((message: string, title = 'Success') => {
    addToast({
      type: 'success',
      title,
      message,
    });
  }, [addToast]);

  const handleWarning = useCallback((message: string, title = 'Warning') => {
    addToast({
      type: 'warning',
      title,
      message,
      duration: 6000,
    });
  }, [addToast]);

  const handleInfo = useCallback((message: string, title = 'Info') => {
    addToast({
      type: 'info',
      title,
      message,
    });
  }, [addToast]);

  return (
    <ErrorContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      clearToasts,
      handleError,
      handleSuccess,
      handleWarning,
      handleInfo
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};