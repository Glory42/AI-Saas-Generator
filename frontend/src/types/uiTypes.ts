import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface TemplateProps {
    id: string;
    label: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
}

export interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

export interface PageLoaderProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export interface ModalProps {
    children: ReactNode;
    buttonCaption?: string;
    className?: string;
    onClose?: () => void;
}

export interface ModalHandle {
    open: () => void;
    close: () => void;
}

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  loading?: boolean;
}
