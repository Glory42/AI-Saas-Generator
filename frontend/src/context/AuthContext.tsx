import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { secureStorage } from '../utils/secureStorage';

interface User {
    id: string;
    email: string;
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
    logoutAllDevices: () => Promise<void>;
    updateUser: (updates: { username?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
        try {
            if (apiClient.isAuthenticated()) {
            try {
                const currentUser = apiClient.getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch (error) {
                console.error('Failed to load current user:', error);
                setUser(null);
            }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            setIsLoading(false);
        }
    };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.login(email, password);
            setUser(response.user);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, username: string) => {
        setIsLoading(true);
        try {
            const response = await apiClient.register(email, password, username);
            setUser(response.user);
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await apiClient.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logoutAllDevices = async () => {
        setIsLoading(true);
        try {
            await apiClient.logoutAllDevices();
            setUser(null);
        } catch (error) {
            console.error('Logout all devices error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (updates: { username?: string; email?: string }) => {
        setIsLoading(true);
        try {
            const updatedUser = await apiClient.updateUserProfile(updates) as User; 
            
            setUser(updatedUser);
            secureStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            isAuthenticated: !!user && apiClient.isAuthenticated(),
            login, 
            register, 
            logout, 
            logoutAllDevices,
            updateUser
        }}>
        {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};