'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { authApi, User, DoctorProfile, api } from './api';

interface AuthContextType {
    user: User | null;
    doctorProfile: DoctorProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const token = Cookies.get('token');
        if (!token) {
            setIsLoading(false);
            api.setToken(null);
            return;
        }

        api.setToken(token);
        try {
            const response = await authApi.getProfile();
            setUser(response.data.user);
            setDoctorProfile(response.data.doctorProfile || null);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            Cookies.remove('token');
            api.setToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        const token = response.data.token;
        Cookies.set('token', token, { expires: 7 });
        api.setToken(token);
        setUser(response.data.user);
        if (response.data.user.role === 'doctor') {
            await refreshUser();
        }
    };

    const logout = () => {
        Cookies.remove('token');
        api.setToken(null);
        setUser(null);
        setDoctorProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                doctorProfile,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
