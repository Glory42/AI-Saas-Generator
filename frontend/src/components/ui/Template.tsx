import Button from './Button';
import { type TemplateProps } from '../../types/uiTypes';

export default function Template({ id, label, description, isSelected, onClick }: TemplateProps) {
    void id; // Mark as used to avoid TypeScript warning
    return (
        <div 
        className={`flex flex-col items-center space-y-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
            isSelected ? 'scale-105' : ''
        }`}
        onClick={onClick}
        >
        <Button
            className={`w-full min-w-[150px] ${
            isSelected 
                ? 'ring-2 ring-white ring-offset-2 ring-offset-custom-bg' 
                : ''
            }`}
        >
            {label}
        </Button>
        <p className="text-white/80 text-sm text-center max-w-[150px] px-2">
            {description}
        </p>
        </div>
    );
}