import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { apiClient } from '../services/apiClient';
import { useTemplates } from '../hooks/useTemplates';
import Button from '../components/ui/Button';
import Template from '../components/ui/Template';
import Navigation from '../components/Navigation';

interface ImageResult {
    id: string;
    original_url: string;
    generated_url: string;
    cost_usd: number;
    model_tier: string;
    template: string;
    status: string;
    created_at: string;
    generated_at: string;
}

export default function Dashboard() {
    const { } = useAuth();
    const { templates, loading: templatesLoading } = useTemplates();
    const [file, setFile] = useState<File | null>(null);
    const [imageId, setImageId] = useState<number | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    
    const [resultRecord, setResultRecord] = useState<ImageResult | null>(null);
    const [loading, setLoading] = useState(false);
    const { handleError, handleSuccess } = useError();

    const handleUpload = async () => {
        if (!file) return;
            setLoading(true);
        try {
            const data = await apiClient.uploadImage(file);
            if (data.success) {
                setImageId(data.id);
                setPreview(data.imageUrl);
                handleSuccess('Image uploaded successfully!');
            }
        } catch (err: any) {
            handleError(err, 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!imageId || !selectedTemplate) return;
        setLoading(true);
        try {
            const data = await apiClient.generateImage(imageId, selectedTemplate);
            if (data.success) {
                setResultRecord(data.data);
                
                const message = data.meta?.cached 
                ? 'Image generated from cache (instant & free)!'
                : 'Image generated successfully!';
                handleSuccess(message);
            }
        } catch (err: any) {
            handleError(err, 'Generation failed');
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
            setResultRecord(null); // Reset result
        }
    };

    const clearAll = () => {
        setFile(null);
        setImageId(null);
        setPreview(null);
        setResultRecord(null);
    };

    return (
        <div className="min-h-screen bg-custom-bg text-white flex flex-col">
        <Navigation />

        <div className="flex-1 flex flex-col">
            {/* Templates Section */}
            <section className="w-full mt-8 pt-8 pb-4">
            <h2 className="text-center text-xl font-semibold mb-6 text-white/80">Select a Style</h2>
            {templatesLoading ? (
                <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-stone-600 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="flex flex-row gap-4 justify-center flex-wrap px-4">
                {templates.map((template) => (
                    <Template
                    key={template.id}
                    id={template.id}
                    label={`${template.modelTier === 'pro' ? '🔥' : '⚡'} ${template.label}`}
                    description={template.modelTier === 'pro' ? 'Premium Quality' : 'Fast & Efficient'}
                    isSelected={selectedTemplate === template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    />
                ))}
                </div>
            )}
            </section>

            {/* "Modal Style" Main Container */}
            <main className="w-full px-4 md:px-20 my-6 flex justify-center pb-20">
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
                
                {/* Top Area: The Two Images (Grid Layout) */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[400px]">
                
                {/* LEFT: Original / Upload */}
                <div className="flex flex-col h-full">
                    <h3 className="text-sm font-medium mb-3 text-black uppercase tracking-wider">Original Product</h3>
                    <div className="flex-1 bg-black/20 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
                    
                    {!file ? (
                        <div className="text-center p-8">
                        <input 
                            type="file" 
                            onChange={handleFileChange}
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">📤</div>
                        <p className="text-black text-sm font-medium">Click to Upload Image</p>
                        </div>
                    ) : (
                        <img 
                        src={preview!} 
                        alt="Original" 
                        className="w-full h-full object-contain p-2"
                        />
                    )}
                    </div>

                    {/* Confirm Upload Button (Only shows if file selected but not uploaded) */}
                    {file && !imageId && (
                    <Button onClick={handleUpload} disabled={loading} className="w-full mt-4 bg-purple-600">
                        {loading ? 'Uploading...' : 'Confirm Upload'}
                    </Button>
                    )}
                </div>

                {/* RIGHT: Generated / Result */}
                <div className="flex flex-col h-full">
                    <h3 className="text-sm font-medium mb-3 text-black uppercase tracking-wider">AI Result</h3>
                    <div className="flex-1 bg-black/20 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden">
                    
                    {loading ? (
                        <div className="text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-black animate-pulse">Generating Magic...</p>
                        </div>
                    ) : resultRecord ? (
                        <img 
                        src={resultRecord.generated_url} 
                        alt="Generated" 
                        className="w-full h-full object-contain p-2"
                        />
                    ) : (
                        <div className="text-center p-8 opacity-40">
                        <div className="text-5xl mb-4">✨</div>
                        <p className="text-sm text-black">Select template & generate</p>
                        </div>
                    )}
                    </div>

                    {/* Download / Generate Buttons */}
                    {resultRecord ? (
                    <a 
                        href={resultRecord.generated_url} 
                        download target="_blank"
                        className="mt-4 block w-full text-center py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        Download Result
                    </a>
                    ) : (
                    imageId && (
                        <Button 
                        onClick={handleGenerate}
                        disabled={loading || !selectedTemplate}
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
                        >
                        {loading ? 'Processing...' : '🚀 Generate AI Image'}
                        </Button>
                    )
                    )}
                </div>
                </div>

                {/* Stats Bar (The Dark Section from Modal) */}
                {resultRecord && (
                <div className="bg-slate-200 border-t border-white/10 p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div>
                    <span className="block text-black text-xs uppercase mb-1">Status</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold">
                        COMPLETED
                    </span>
                    </div>
                    <div>
                    <span className="block text-black text-xs uppercase mb-1">Model Tier</span>
                    <span className="font-medium text-red-400">
                        {resultRecord.model_tier === 'pro' ? '🔥 Pro' : '⚡ Flash'}
                    </span>
                    </div>
                    <div>
                    <span className="block text-black text-xs uppercase mb-1">Cost</span>
                    <span className="font-mono text-green-400">
                        ${Number(resultRecord.cost_usd).toFixed(4)}
                    </span>
                    </div>
                    <div className="text-right">
                    <Button onClick={clearAll} className="bg-white/10 hover:bg-white/20 text-xs py-1 px-3 h-auto">
                        Start New
                    </Button>
                    </div>
                </div>
                )}
            </div>
            </main>
        </div>
        </div>
    );
}