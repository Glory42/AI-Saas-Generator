import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TEMPLATES = [
  { id: 'instagram-promo', label: '📸 Instagram Promo', desc: 'Vibrant, high-energy social post.' },
  { id: 'ecommerce-clean', label: '🛍️ E-Commerce Clean', desc: 'Studio lighting on white background.' },
  { id: 'lifestyle-outdoor', label: '🌿 Lifestyle Outdoor', desc: 'Natural sunlight and bokeh.' },
];

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [imageId, setImageId] = useState<number | null>(null); // From DB
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Upload Handler
  const handleUpload = async () => {
    if (!file || !token) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // Protected Route!
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageId(data.id);
        setPreview(data.imageUrl);
      }
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Handler
  const handleGenerate = async () => {
    if (!imageId || !selectedTemplate || !token) return;
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ imageId, templateId: selectedTemplate })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedImage(data.data.generated_url);
      }
    } catch (err) {
      alert('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="border-b border-gray-800 p-4 flex justify-between items-center bg-gray-950">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          AI Studio <span className="text-xs text-gray-500 font-mono">v0.1</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Hello, {user?.username}</span>
          <button onClick={logout} className="text-sm bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left: Controls */}
        <div className="space-y-8">
          
          {/* Step 1: Upload */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">1. Upload Product</h2>
            <input 
              type="file" 
              onChange={(e) => {
                if(e.target.files) {
                  setFile(e.target.files[0]);
                  setPreview(URL.createObjectURL(e.target.files[0])); // Local preview
                  setImageId(null); // Reset
                  setGeneratedImage(null);
                }
              }}
              className="block w-full text-sm text-gray-400 file:bg-indigo-600 file:text-white file:border-0 file:rounded-full file:px-4 file:py-2 file:mr-4 hover:file:bg-indigo-500 cursor-pointer"
            />
            {file && !imageId && (
              <button 
                onClick={handleUpload} 
                disabled={loading}
                className="mt-4 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded font-medium transition"
              >
                {loading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            )}
          </div>

          {/* Step 2: Template */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">2. Select Style</h2>
            <div className="grid grid-cols-1 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`p-4 rounded-lg border text-left transition ${
                    selectedTemplate === t.id 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-bold text-sm">{t.label}</div>
                  <div className="text-xs text-gray-400">{t.desc}</div>
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={!imageId || !selectedTemplate || loading}
              className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '✨ Generating Magic...' : '🚀 Generate AI Image'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="bg-gray-950 rounded-2xl border border-gray-800 p-4 flex flex-col gap-4 min-h-[500px]">
           <h2 className="text-gray-400 text-sm font-mono uppercase tracking-wider">Workspace</h2>
           
           <div className="flex-1 flex flex-col gap-4">
             {/* Before */}
             {preview && (
               <div className="relative group">
                 <span className="absolute top-2 left-2 bg-black/60 text-xs px-2 py-1 rounded backdrop-blur">Original</span>
                 <img src={preview} alt="Original" className="w-full h-64 object-cover rounded-lg border border-gray-800" />
               </div>
             )}

             {/* After */}
             {generatedImage ? (
                <div className="relative animate-fade-in">
                  <span className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded backdrop-blur">AI Result</span>
                  <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-lg border border-green-500/30 shadow-2xl shadow-green-500/10" />
                  <a href={generatedImage} download target="_blank" className="mt-2 block text-center text-sm text-green-400 hover:underline">Download High Res</a>
                </div>
             ) : (
                loading && (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-lg">
                    <div className="text-center">
                       <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                       <p className="text-gray-500 text-sm animate-pulse">Designing your image...</p>
                    </div>
                  </div>
                )
             )}
           </div>
        </div>
      </main>
    </div>
  );
}