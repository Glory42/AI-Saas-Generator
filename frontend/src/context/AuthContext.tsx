import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { secureStorage } from '../utils/secureStorage';
import { type User, type AuthContextType, type UpdateProfileResponse } from '../types/contextTypes';

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
            const response = await apiClient.updateUserProfile(updates) as UpdateProfileResponse;
            
            const freshUser = response.updatedUser;

            if (!freshUser || !freshUser.id) {
                throw new Error("Invalid data received from server");
            }

            setUser(freshUser);
            secureStorage.setItem('user', JSON.stringify(freshUser));
            
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