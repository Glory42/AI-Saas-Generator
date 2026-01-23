import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import type { ModalHandle } from './ui/Modal';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // Only for register
    const { login, register, isLoading } = useAuth();
    const { handleError } = useError();
    const modalRef = useRef<ModalHandle>(null);

    // Handle modal open/close based on isOpen prop
    if (isOpen && modalRef.current) {
        modalRef.current.open();
    } else if (!isOpen && modalRef.current) {
        modalRef.current.close();
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
        if (isLogin) {
            await login(email, password);
        } else {
            await register(email, password, username);
        }
        onClose();
        } catch (err: any) {
        handleError(err);
        }
    };

    return (
        <Modal 
        ref={modalRef} 
        buttonCaption="Close" 
        className="bg-custom-bg border border-white/20"
        onClose={() => {
            onClose();
            // Reset form when modal closes
            setEmail('');
            setPassword('');
            setUsername('');
        }}
        >
        <div className="w-96">
            <h2 className="text-2xl font-bold text-white mb-6">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            


            <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <Input 
                type="text" 
                label="Username"
                placeholder="Enter username"
                className="p-3 bg-custom-bg/80 border border-white/20 rounded-lg text-white"
                value={username} 
                onChange={(e: any) => setUsername(e.target.value)}
                />
            )}
            <Input 
                type="email" 
                label="Email"
                placeholder="Enter email"
                className="p-3 bg-custom-bg/80 border border-white/20 rounded-lg text-white"
                value={email} 
                onChange={(e: any) => setEmail(e.target.value)}
            />
            <Input 
                type="password" 
                label="Password"
                placeholder="Enter password"
                className="p-3 bg-custom-bg/80 border border-white/20 rounded-lg text-white"
                value={password} 
                onChange={(e: any) => setPassword(e.target.value)}
            />
            
            <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3"
            >
                {isLoading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Login' : 'Sign Up')}
            </Button>
            </form>

            <p className="mt-4 text-center text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
                {isLogin ? 'Sign Up' : 'Login'}
            </button>
            </p>
        </div>
        </Modal>
    );
}