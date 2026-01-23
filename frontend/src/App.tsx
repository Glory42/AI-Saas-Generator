import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import AuthModal from './components/AuthModal';
import PageLoader from './components/ui/PageLoader';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import Button from './components/ui/Button';
import ToastContainer from './components/ui/ToastContainer';

function Layout() {
    const { user, isLoading } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);

    if (isLoading) {
        return <PageLoader text="Checking authentication..." size="lg" />;
    }

    // Protected View
    if (user) {
        return (
        <Router>
            <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer />
        </Router>
        );
    }

    // Landing Page View
    return (
        <Router>
        <div className="min-h-screen bg-custom-bg text-white flex flex-col items-center justify-center">
            <div className="text-center max-w-2xl px-4">
            <h1 className="text-6xl font-black mb-6 tracking-tighter">
                Saas Generator
            </h1>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
                Think again there is a another way, Turn your blurry phone photos into 
                <span className="text-white"> professional e-commerce assets</span> in seconds.
            </p>
            
            <div className="flex gap-4 justify-center">
                <Button 
                onClick={() => setModalOpen(true)}
                className="px-8 py-4 rounded-lg"
                >
                Get Started Free
                </Button>
                
            </div>
            </div>

            <AuthModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
            <ToastContainer />
        </div>
        </Router>
    );
}

export default function App() {
    return (
        <ErrorProvider>
            <AuthProvider>
                <Layout />
            </AuthProvider>
        </ErrorProvider>
    );
}