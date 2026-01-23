import type { ButtonHTMLAttributes, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export default function Button({ children, className = "", loading = false, ...props }: ButtonProps) {
  return (
    <button 
      className={`px-6 py-2 rounded-lg bg-white text-black hover:bg-purple-200 disabled:bg-purple-600 disabled:cursor-not-allowed transition-all duration-300 shadow-stone hover:shadow-dark hover:scale-105 inline-flex items-center justify-center ${className}`}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
}