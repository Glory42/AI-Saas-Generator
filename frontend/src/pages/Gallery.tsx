import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { apiClient } from '../services/apiClient';
import { type ImageRecord } from '../types/pagesTypes';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Navigation from '../components/Navigation';

export default function Gallery() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleError } = useError();
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
    const [pagination, setPagination] = useState({ limit: 20, offset: 0, count: 0 });
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        loadImages(true); 
    }, [user, navigate]);

    const loadImages = async (reset = false) => {
        if (!user) return;
        
        setLoading(true);
        try {
            const currentOffset = reset ? 0 : images.length;

            const response = await apiClient.getUserImages(pagination.limit, currentOffset);
            
            if (reset) {
                setImages(response.images); // Replace list
            } else {
                setImages(prev => [...prev, ...response.images]); // Append to list
            }
            
            setPagination(response.pagination);
            setHasMore(response.images.length === pagination.limit);
        } catch (error) {
            handleError(error, 'Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            loadImages(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const refreshGallery = () => {
        loadImages(true);
    };

    return (
        <div className="min-h-screen bg-custom-bg text-white">
        <Navigation />
        
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Image Gallery</h1>
            <div className="flex gap-3">
                <Button 
                onClick={refreshGallery}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500"
                >
                {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                onClick={() => navigate('/')}
                className="bg-transparent border border-white/20 hover:bg-white/10"
                >
                Back to Dashboard
                </Button>
            </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">{images.length}</div>
                <div className="text-sm text-white/70">Total Images</div>
            </div>
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">
                {images.filter(img => img.generated_url).length}
                </div>
                <div className="text-sm text-white/70">Generated</div>
            </div>
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">
                ${images.reduce((sum, img) => sum + (img.cost_usd || 0), 0).toFixed(4)}
                </div>
                <div className="text-sm text-white/70">Total Spent</div>
            </div>
            <div className="bg-darkblue rounded-lg p-4 border border-white/20">
                <div className="text-2xl font-bold">
                {images.filter(img => img.model_tier === 'pro').length}
                </div>
                <div className="text-sm text-white/70">Pro Generations</div>
            </div>
            </div>

            {/* Image Grid */}
            {loading && images.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-darkblue rounded-lg border border-white/20 overflow-hidden">
                    <Skeleton variant="rectangular" height="200px" className="w-full" />
                    <div className="p-3 space-y-2">
                    <Skeleton variant="text" lines={2} />
                    <Skeleton variant="text" width="60%" />
                    </div>
                </div>
                ))}
            </div>
            ) : images.length === 0 ? (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">📸</div>
                <h2 className="text-xl font-semibold mb-2">No images yet</h2>
                <p className="text-white/60 mb-6">Start creating AI-generated images to see them here!</p>
                <Button onClick={() => navigate('/')}>
                Go to Dashboard
                </Button>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((image) => (
                <div
                    key={image.id}
                    className="bg-darkblue rounded-lg border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                >
                    <div className="aspect-square relative bg-gray-800">
                    <img
                        src={image.generated_url || image.original_url}
                        alt={`Generated image ${image.id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    
                    {!image.generated_url && (
                        <div className="absolute top-2 left-2 bg-yellow-500/80 text-yellow-900 text-xs px-2 py-1 rounded">
                        Original Only
                        </div>
                    )}
                    
                    {image.generated_url && (
                        <div className="absolute top-2 left-2 bg-green-500/80 text-green-900 text-xs px-2 py-1 rounded">
                        Generated
                        </div>
                    )}
                    
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {image.model_tier === 'pro' ? '🔥 Pro' : '⚡ Flash'}
                    </div>
                    </div>
                    
                    <div className="p-3">
                    <div className="text-xs text-white/60 mb-1">
                        Created: {formatDate(image.created_at)}
                    </div>
                    
                    {image.generated_at && (
                        <div className="text-xs text-white/60 mb-1">
                        Generated: {formatDate(image.generated_at)}
                        </div>
                    )}
                    
                    {image.template && (
                        <div className="text-xs text-blue-400 mb-1">
                        Template: {image.template}
                        </div>
                    )}
                    
                    {image.cost_usd && image.cost_usd > 0 && (
                        <div className="text-xs text-green-400">
                        Cost: ${image.cost_usd.toFixed(4)}
                        </div>
                    )}
                    </div>
                </div>
                ))}
            </div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && images.length > 0 && (
            <div className="text-center mt-8">
                <Button onClick={loadMore} className="bg-blue-600 hover:bg-blue-500">
                Load More Images
                </Button>
            </div>
            )}

            {/* Loading indicator for load more */}
            {loading && images.length > 0 && (
            <div className="text-center mt-8">
                <LoadingSpinner text="Loading more images..." size="sm" />
            </div>
            )}
        </div>

        {/* Image Detail Modal */}
        {selectedImage && (
            <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
            >
            <div 
                className="bg-darkblue rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">Image Details</h3>
                    <Button
                    onClick={() => setSelectedImage(null)}
                    className="bg-transparent hover:bg-white/10"
                    >
                    ×
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Original Image */}
                    <div>
                    <h4 className="text-sm font-medium mb-2 text-white/70">Original</h4>
                    <img
                        src={selectedImage.original_url}
                        alt="Original"
                        className="w-full rounded-lg border border-white/10"
                    />
                    <Button
                        onClick={() => downloadImage(selectedImage.original_url, `original-${selectedImage.id}.jpg`)}
                        className="w-full mt-2"
                    >
                        Download Original
                    </Button>
                    </div>
                    
                    {/* Generated Image */}
                    {selectedImage.generated_url ? (
                    <div>
                        <h4 className="text-sm font-medium mb-2 text-white/70">Generated</h4>
                        <img
                        src={selectedImage.generated_url}
                        alt="Generated"
                        className="w-full rounded-lg border border-white/10"
                        />
                        <Button
                        onClick={() => downloadImage(selectedImage.generated_url!, `generated-${selectedImage.id}.jpg`)}
                        className="w-full mt-2"
                        >
                        Download Generated
                        </Button>
                    </div>
                    ) : (
                    <div className="flex items-center justify-center border-2 border-dashed border-white/20 rounded-lg">
                        <div className="text-center p-8">
                        <div className="text-4xl mb-2">🤔</div>
                        <p className="text-white/60">Not generated yet</p>
                        </div>
                    </div>
                    )}
                </div>
                
                {/* Image Info */}
                <div className="bg-black/30 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                        selectedImage.generated_url 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                        {selectedImage.generated_url ? 'Completed' : 'Original Only'}
                    </span>
                    </div>
                    
                    <div className="flex justify-between">
                    <span className="text-white/60">Created:</span>
                    <span>{formatDate(selectedImage.created_at)}</span>
                    </div>
                    
                    {selectedImage.generated_at && (
                    <div className="flex justify-between">
                        <span className="text-white/60">Generated:</span>
                        <span>{formatDate(selectedImage.generated_at)}</span>
                    </div>
                    )}
                    
                    {selectedImage.template && (
                    <div className="flex justify-between">
                        <span className="text-white/60">Template:</span>
                        <span className="text-blue-400">{selectedImage.template}</span>
                    </div>
                    )}
                    
                    {selectedImage.model_tier && (
                    <div className="flex justify-between">
                        <span className="text-white/60">Model Tier:</span>
                        <span>{selectedImage.model_tier === 'pro' ? '🔥 Pro' : '⚡ Flash'}</span>
                    </div>
                    )}
                    
                    {selectedImage.cost_usd && selectedImage.cost_usd > 0 && (
                    <div className="flex justify-between">
                        <span className="text-white/60">Cost:</span>
                        <span className="text-green-400">${selectedImage.cost_usd.toFixed(4)}</span>
                    </div>
                    )}
                    
                    <div className="flex justify-between">
                    <span className="text-white/60">Image ID:</span>
                    <span className="font-mono text-xs">{selectedImage.id}</span>
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    );
}