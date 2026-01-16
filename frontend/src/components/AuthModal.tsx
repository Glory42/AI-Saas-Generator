import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // Only for register
  const { login } = useAuth();
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Determine Endpoint: /api/users/login OR /api/users/register
    const endpoint = isLogin ? 'http://localhost:5000/api/users/login' : 'http://localhost:5000/api/users/register';
    const body = isLogin ? { email, password } : { email, password, username, phone: 1234567890 }; // Phone dummy for now

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      login(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              type="text" placeholder="Username" 
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
              value={username} onChange={e => setUsername(e.target.value)}
            />
          )}
          <input 
            type="email" placeholder="Email" 
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" 
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded transition">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
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
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
      </div>
    </div>
  );
}