import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

export default function Navigation() {
    const navigate = useNavigate();
    const { user, logout, isLoading } = useAuth();

    const handleLogout = async () => {
        try {
        await logout();
        } catch (err) {
        console.error('Logout error:', err);
        }
    };

    return (
        <header className="w-full bg-custom-bg border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold">AI Product Studio</h1>
            
            {user && (
                <nav className="hidden md:flex space-x-4">
                <Button
                    onClick={() => navigate('/')}
                    className="bg-transparent hover:bg-white/10 text-sm"
                >
                    Dashboard
                </Button>
                
                <Button
                    onClick={() => navigate('/gallery')}
                    className="bg-transparent hover:bg-white/10 text-sm"
                >
                    Gallery
                </Button>

                <Button
                    onClick={() => navigate('/profile')}
                    className="bg-transparent hover:bg-white/10 text-sm"
                >
                    Profile
                </Button>
                
                {user.role === 'admin' && (
                    <Button
                    onClick={() => navigate('/admin')}
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-sm border border-purple-500/30"
                    >
                    Admin
                    </Button>
                )}
                </nav>
            )}
            </div>

            {user && (
            <div className="flex items-center space-x-4">
                <span className="hidden md:block text-sm text-white/70">
                Welcome, {user.username}
                </span>
                <Button 
                onClick={handleLogout} 
                disabled={isLoading}
                loading={isLoading}
                className="bg-red-600 hover:bg-red-500"
                >
                {isLoading ? '' : 'Logout'}
                </Button>
            </div>
            )}
        </div>
        </header>
    );
}