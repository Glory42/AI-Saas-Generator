export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ErrorContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  handleError: (error: unknown, fallbackMessage?: string) => void;
  handleSuccess: (message: string, title?: string) => void;
  handleWarning: (message: string, title?: string) => void;
  handleInfo: (message: string, title?: string) => void;
}


export interface User {
    id: string;
    email: string;
    username: string;
    role: string;
}

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    logoutAllDevices: () => Promise<void>;
    updateUser: (updates: { username?: string; email?: string }) => Promise<void>;
}

export interface UpdateProfileResponse {
    message: string;
    updatedUser: User;
}
