interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <div 
          className={`${sizeClasses[size]} ${borderClasses[size]} border-stone-700 border-t-transparent rounded-full animate-spin`}
        ></div>
        {text && (
          <p className="mt-3 text-sm text-white/60">{text}</p>
        )}
      </div>
    </div>
  );
}