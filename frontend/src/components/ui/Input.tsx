import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ForwardRefRenderFunction } from 'react';


interface InputProps {
    label: string;
    textarea?: boolean;
    className?: string;
}

type BaseInputProps = InputProps & (InputHTMLAttributes<HTMLInputElement> | TextareaHTMLAttributes<HTMLTextAreaElement>);

const Input: ForwardRefRenderFunction<HTMLInputElement | HTMLTextAreaElement, BaseInputProps> = 
    function Input({ label, textarea, className = "", ...props }, ref) {
        const baseClasses = "w-full p-3 border-b-2 rounded-sm border-white/20 bg-custom-bg text-white focus:outline-none focus:border-white/60";
        const classes = `${baseClasses} ${className}`;
        
        return (
        <p className="flex flex-col gap-1 my-4">
            <label className="text-sm font-bold uppercase text-white/80">{label}</label>
            {textarea ? 
            <textarea 
                ref={ref as React.RefObject<HTMLTextAreaElement>} 
                className={classes} 
                {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)} 
            /> 
            : 
            <input 
                ref={ref as React.RefObject<HTMLInputElement>} 
                className={classes} 
                {...(props as InputHTMLAttributes<HTMLInputElement>)} 
            />
            }
        </p>
    );
};

export default forwardRef(Input);