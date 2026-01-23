import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { type Template } from '../types/hookTypes';

interface UseTemplatesReturn {
    templates: Template[];
    loading: boolean;
    error: string | null;
    getTemplateById: (id: string) => Template | undefined;
    refetchTemplates: () => Promise<void>;
}

export function useTemplates(): UseTemplatesReturn {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await apiClient.getTemplates();
            setTemplates(response.templates.map(t => ({ 
                ...t, 
                modelTier: t.modelTier as 'flash' | 'pro' 
            })));
        } catch (err: any) {
            setError(err.message || 'Failed to fetch templates');
            console.error('Template fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const getTemplateById = (id: string) => {
        return templates.find(template => template.id === id);
    };

    const refetchTemplates = async () => {
        await fetchTemplates();
    };

    return {
        templates,
        loading,
        error,
        getTemplateById,
        refetchTemplates,
    };
}