import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button 
      className={`px-6 py-2 rounded-lg bg-stone-700 text-white hover:bg-stone-500 disabled:bg-stone-600 disabled:cursor-not-allowed transition-all duration-300 shadow-stone hover:shadow-dark hover:scale-105 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}