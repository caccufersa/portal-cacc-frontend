'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface AuthUser {
    username: string;
    token: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_API = 'https://backend-go-portal-u9o8.onrender.com';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const tokenRef = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function restore() {
            const stored = localStorage.getItem('cacc-auth');
            if (!stored) return;
            try {
                const parsed = JSON.parse(stored) as AuthUser;
                const res = await fetch(`${AUTH_API}/auth/session`, {
                    headers: { Authorization: `Bearer ${parsed.token}` },
                });
                if (cancelled) return;
                if (res.ok) {
                    tokenRef.current = parsed.token;
                    setUser(parsed);
                } else {
                    localStorage.removeItem('cacc-auth');
                }
            } catch {
                if (!cancelled) localStorage.removeItem('cacc-auth');
            }
        }

        restore().finally(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${AUTH_API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const text = await res.text();
            let data: Record<string, string> = {};
            try { data = JSON.parse(text); } catch { /* ignore */ }

            if (!res.ok) {
                const msg = data.erro || data.error || 'Usuario ou senha invalidos';
                setError(msg);
                setIsLoading(false);
                return false;
            }

            if (!data.token) {
                setError('Resposta invalida do servidor.');
                setIsLoading(false);
                return false;
            }

            const authUser: AuthUser = {
                username: data.username || username,
                token: data.token,
            };
            tokenRef.current = data.token;
            setUser(authUser);
            localStorage.setItem('cacc-auth', JSON.stringify(authUser));
            setIsLoading(false);
            return true;
        } catch {
            setError('Erro de conexao. Tente novamente.');
            setIsLoading(false);
            return false;
        }
    }, []);

    const register = useCallback(async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${AUTH_API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const text = await res.text();
                let msg = 'Erro ao criar conta';
                try {
                    const j = JSON.parse(text);
                    if (j.erro || j.error) msg = j.erro || j.error;
                } catch { /* ignore */ }
                setError(msg);
                setIsLoading(false);
                return false;
            }

            setIsLoading(false);
            return true;
        } catch {
            setError('Erro de conexao. Tente novamente.');
            setIsLoading(false);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        if (tokenRef.current) {
            try {
                await fetch(`${AUTH_API}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${tokenRef.current}` },
                });
            } catch { /* ignore */ }
        }
        tokenRef.current = null;
        setUser(null);
        localStorage.removeItem('cacc-auth');
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
