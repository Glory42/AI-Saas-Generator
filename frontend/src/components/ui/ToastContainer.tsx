import { useError } from '../../context/ErrorContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useError();

    const getToastIcon = (type: string) => {
        switch (type) {
        case 'success':
            return '✓';
        case 'error':
            return '✕';
        case 'warning':
            return '⚠';
        case 'info':
            return 'ℹ';
        default:
            return 'ℹ';
        }
    };

    const getToastStyles = (type: string) => {
        const baseStyles = 'p-4 rounded-lg shadow-lg border mb-2 transform transition-all duration-300 ease-in-out';
        
        switch (type) {
        case 'success':
            return `${baseStyles} bg-green-500/20 border-green-500/30 text-white`;
        case 'error':
            return `${baseStyles} bg-red-500/20 border-red-500/30 text-white`;
        case 'warning':
            return `${baseStyles} bg-yellow-500/20 border-yellow-500/30 text-white`;
        case 'info':
            return `${baseStyles} bg-blue-500/20 border-blue-500/30 text-white`;
        default:
            return `${baseStyles} bg-gray-500/20 border-gray-500/30 text-white`;
        }
    };

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
        {toasts.map((toast) => (
            <div
            key={toast.id}
            className={getToastStyles(toast.type)}
            style={{
                animation: 'slideInRight 0.3s ease-out',
            }}
            >
            <div className="flex items-start">
                <span className="text-xl mr-3 flex-shrink-0">
                {getToastIcon(toast.type)}
                </span>
                <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="font-semibold text-sm">
                    {toast.title}
                    </p>
                )}
                {toast.message && (
                    <p className="text-sm mt-1 opacity-90">
                    {toast.message}
                    </p>
                )}
                </div>
                <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 flex-shrink-0 text-white/70 hover:text-white transition-colors"
                aria-label="Close notification"
                >
                <span className="text-lg leading-none">×</span>
                </button>
            </div>
            </div>
        ))}
        
        <style>{`
            @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
            }
        `}</style>
        </div>
    );
}