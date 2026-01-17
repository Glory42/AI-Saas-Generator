import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import Button from './components/ui/Button';

function Layout() {
  const { user } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);

  // Protected View
  if (user) {
    return <Dashboard />;
  }

  // Landing Page View
  return (
    <div className="min-h-screen bg-custom-bg text-white flex flex-col items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-6xl font-black mb-6 tracking-tighter">
          AI Product Studio
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
          <Button 
            onClick={() => alert('Demo coming soon!')}
            className="px-8 py-4 rounded-lg border-2 border-stone-600 hover:border-stone-400 bg-transparent hover:bg-stone-600/20"
          >
            View Demo
          </Button>
        </div>
      </div>

      <AuthModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}