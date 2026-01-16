import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';

function Layout() {
  const { user } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);

  // Protected View
  if (user) {
    return <Dashboard />;
  }

  // Landing Page View
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>

      <div className="relative z-10 text-center max-w-2xl px-4">
        <h1 className="text-6xl font-black mb-6 tracking-tighter bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
          AI Product Studio
        </h1>
        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          Stop paying photographers. Turn your blurry phone photos into 
          <span className="text-indigo-400"> professional e-commerce assets</span> in seconds.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition transform hover:scale-105"
          >
            Get Started Free
          </button>
          <button className="px-8 py-4 rounded-full font-bold text-gray-300 hover:text-white border border-gray-800 hover:border-gray-600 transition">
            View Demo
          </button>
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