import { type SkeletonProps } from '../../types/uiTypes';

export default function Skeleton({ 
    className = '', 
    variant = 'text', 
    width, 
    height, 
    lines = 3 
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-gray-700 rounded';
    
    if (variant === 'text') {
        return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, index) => (
            <div
                key={index}
                className={`${baseClasses} h-4`}
                style={{
                width: index === lines - 1 ? '70%' : '100%',
                }}
            ></div>
            ))}
        </div>
        );
    }
    
    if (variant === 'circular') {
        return (
        <div
            className={`${baseClasses} rounded-full`}
            style={{
            width: width || 40,
            height: height || 40,
            }}
        ></div>
        );
    }
    
    return (
        <div
        className={`${baseClasses} ${className}`}
        style={{
            width,
            height,
        }}
        ></div>
    );
}