import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Template from '../components/ui/Template';

const TEMPLATES = [
  { id: 'instagram-promo', label: '📸 Instagram Promo', desc: 'Vibrant, high-energy social post.' },
  { id: 'ecommerce-clean', label: '🛍️ E-Commerce Clean', desc: 'Studio lighting on white background.' },
  { id: 'lifestyle-outdoor', label: '🌿 Lifestyle Outdoor', desc: 'Natural sunlight and bokeh.' },
];

export default function Dashboard() {
  const { logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [imageId, setImageId] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // 1. Upload Handler
  const handleUpload = async () => {
    if (!file || !token) return;
    setLoading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setImageId(null);
      setGeneratedImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-custom-bg text-white">
      {/* Header */}
      <header className="w-full bg-custom-bg border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center flex-1">AI Product Studio</h1>
          <Button onClick={logout} className="ml-auto">
            Logout
          </Button>
        </div>
      </header>

      {/* Templates Section */}
      <section className="w-full py-6 px-4">
        <div className="flex flex-row gap-4 justify-center flex-wrap">
          {TEMPLATES.map((template) => (
            <Template
              key={template.id}
              id={template.id}
              label={template.label}
              description={template.desc}
              isSelected={selectedTemplate === template.id}
              onClick={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>
      </section>

      {/* Main Container */}
      <main className="w-full h-[33vh] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl h-full bg-darkblue rounded-xl shadow-dark border border-white/20">
          <div className="flex flex-col md:flex-row h-full">
            {/* Upload Section (Left/Top) */}
            <div className="flex-1 p-6 border-r border-white/20 md:border-r-0 border-b-white/20 md:border-b-0 flex flex-col justify-center">
              <h2 className="text-lg font-semibold mb-4 text-center">Upload Product</h2>
              
              {!file ? (
                <div className="space-y-4">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*"
                    className="block w-full text-sm text-white file:bg-stone-700 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 hover:file:bg-stone-500 cursor-pointer"
                  />
                  <p className="text-white/60 text-sm text-center">
                    Choose an image to upload
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {preview && (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  {!imageId ? (
                    <Button 
                      onClick={handleUpload} 
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Uploading...' : 'Confirm Upload'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-green-400 text-sm text-center">✓ Uploaded successfully</p>
                      {selectedTemplate && (
                        <Button 
                          onClick={handleGenerate}
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? '✨ Generating...' : '🚀 Generate AI Image'}
                        </Button>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={() => {
                      setFile(null);
                      setImageId(null);
                      setPreview(null);
                      setGeneratedImage(null);
                    }}
                    className="w-full bg-transparent border-2 border-stone-600 hover:border-stone-400 hover:bg-stone-600/20"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Result Section (Right/Bottom) */}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h2 className="text-lg font-semibold mb-4 text-center">AI Result</h2>
              
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-stone-700 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/60 text-sm">Generating...</p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="animate-fade-in">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <a 
                    href={generatedImage} 
                    download 
                    target="_blank" 
                    className="mt-2 block text-center text-sm text-green-400 hover:underline"
                  >
                    Download High Res
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🤔</div>
                    <p className="text-white/60 text-sm">Upload an image and select a template to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}