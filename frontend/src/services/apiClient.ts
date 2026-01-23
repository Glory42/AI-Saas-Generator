import { secureStorage } from '../utils/secureStorage';
import { type AuthResponse } from '../types/servicesTypes.ts';
const API_BASE_URL = 'https://ai-saas-generator.onrender.com/api';

class ApiClient {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    constructor() {
        this.loadTokens();
    }

    private loadTokens() {
        this.accessToken = secureStorage.getItem('accessToken');
        this.refreshToken = secureStorage.getItem('refreshToken');
    }

    private saveTokens(token: string, refreshToken: string) {
        this.accessToken = token;
        this.refreshToken = refreshToken;
        secureStorage.setItem('accessToken', token);
        secureStorage.setItem('refreshToken', refreshToken);
    }

    private clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        secureStorage.removeItem('accessToken');
        secureStorage.removeItem('refreshToken');
        secureStorage.removeItem('user');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
            const url = `${API_BASE_URL}${endpoint}`;
            const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (this.accessToken) {
            headers.Authorization = `Bearer ${this.accessToken}`;
        }

        let response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle token expiration and refresh
        if (response.status === 401 && this.refreshToken) {
            const refreshSuccess = await this.refreshAccessToken();
            if (refreshSuccess) {
                headers.Authorization = `Bearer ${this.accessToken}`;
                response = await fetch(url, {
                ...options,
                headers,
                });
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    private async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (!response.ok) {
                this.clearTokens();
                return false;
            }

            const data = await response.json();
            this.saveTokens(data.token, data.refreshToken);
            return true;
        } catch (error) {
            this.clearTokens();
            return false;
        }
    }

    // Authentication methods
    async login(email: string, password: string): Promise<AuthResponse> {
        const data = await this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        this.saveTokens(data.token, data.refreshToken);
        secureStorage.setItem('user', JSON.stringify(data.user));
        return data;
    }

    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        const data = await this.request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username }),
        });

        this.saveTokens(data.token, data.refreshToken);
        secureStorage.setItem('user', JSON.stringify(data.user));
        return data;
    }

    async logout(): Promise<void> {
        try {
        if (this.refreshToken) {
            await this.request('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });
        }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
        }
    }

    async logoutAllDevices(): Promise<void> {
        try {
            await this.request('/auth/logout-all', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout all devices error:', error);
        } finally {
            this.clearTokens();
        }
    }

    // User methods
    async getUserProfile() {
        return this.request('/users/profile');
    }

    async updateUserProfile(updates: { username?: string; email?: string }) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async getUserImages(limit = 20, offset = 0) {
        return this.request<{ 
            message: string; 
            images: any[]; 
            pagination: { limit: number; offset: number; count: number } 
        }>(`/users/images?limit=${limit}&offset=${offset}`);
    }

    async getTemplates() {
        return this.request<{ 
            message: string; 
            templates: Array<{
                id: string;
                label: string;
                modelTier: string;
            }>; 
            count: number 
        }>('/templates');
    }

    async getTemplateById(id: string) {
        return this.request<{
            message: string;
            template: {
                id: string;
                label: string;
                systemPrompt: string;
                modelTier: string;
            }
        }>(`/templates/${id}`);
    }

    async getUserStats() {
        return this.request<{
            message: string;
            stats: {
                totalImages: number;
                totalGenerations: number;
                totalCost: number;
                flashGenerations: number;
                proGenerations: number;
                avgCostPerGeneration: number;
                mostUsedTemplate: string;
                recentActivity: Array<{
                id: string;
                created_at: string;
                generated_at?: string;
                template?: string;
                cost_usd?: number;
                }>;
            }
        }>('/users/stats');
    }

    // Upload and generate methods
    async uploadImage(file: File) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
        }

        return response.json();
    }

    async generateImage(imageId: number, templateId: string) {
        return this.request<{ success: boolean; data: any; meta: { cached: boolean } }>(
            '/generate',
            {
                method: 'POST',
                body: JSON.stringify({ imageId, templateId }),
            }
        );
    }

    // Admin methods
    async getAllUsers() {
        return this.request('/users');
    }

    async getUserById(id: string) {
        return this.request(`/users/${id}`);
    }

    async updateUserById(id: string, updates: any) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteUser(id: string) {
        return this.request(`/users/${id}`, {
            method: 'DELETE',
        });
    }

    async updateUserRole(id: string, role: string) {
        return this.request(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
        });
    }

    // Utility methods
    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    getCurrentUser() {
        const userStr = secureStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

export const apiClient = new ApiClient();