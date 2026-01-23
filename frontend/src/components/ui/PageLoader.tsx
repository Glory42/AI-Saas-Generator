
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export default function PageLoader({ 
    text = 'Loading...', 
    size = 'md',
    fullScreen = true 
}: PageLoaderProps) {
    const containerClasses = fullScreen 
        ? 'min-h-screen flex items-center justify-center'
        : 'py-12 flex items-center justify-center';

    return (
        <div className={`${containerClasses} bg-custom-bg text-white`}>
        <LoadingSpinner text={text} size={size} />
        </div>
    );
}