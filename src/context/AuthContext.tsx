'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    type ReactNode,
} from 'react';

export interface AuthUser {
    id: number;
    uuid: string;
    username: string;
    avatar_url?: string;
    created_at: string;
}

interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

interface AuthContextType {
    user: AuthUser | null;
    accessToken: string | null;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
    apiCall: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
    updateAuthUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';
const STORAGE_USER = 'cacc-user';
const STORAGE_ACCESS = 'cacc-access-token';
const STORAGE_REFRESH = 'cacc-refresh-token';

function saveTokens(tokens: AuthTokens) {
    localStorage.setItem(STORAGE_ACCESS, tokens.access_token);
    localStorage.setItem(STORAGE_REFRESH, tokens.refresh_token);
}

function loadTokens(): AuthTokens | null {
    const access_token = localStorage.getItem(STORAGE_ACCESS);
    const refresh_token = localStorage.getItem(STORAGE_REFRESH);
    if (!access_token || !refresh_token) return null;
    return { access_token, refresh_token };
}

function clearStorage() {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_ACCESS);
    localStorage.removeItem(STORAGE_REFRESH);
    localStorage.removeItem('cacc-auth');
}

function saveUser(user: AuthUser) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

function loadUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_USER);
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch (_e) {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const accessTokenRef = useRef<string | null>(null);
    const refreshTokenRef = useRef<string | null>(null);
    const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

    const setTokens = useCallback((tokens: AuthTokens) => {
        accessTokenRef.current = tokens.access_token;
        refreshTokenRef.current = tokens.refresh_token;
        setAccessToken(tokens.access_token);
        saveTokens(tokens);
    }, []);

    const handleAuthSuccess = useCallback((data: {
        access_token: string;
        refresh_token: string;
        user: AuthUser;
    }) => {
        setTokens({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
        });
        setUser(data.user);
        saveUser(data.user);
    }, [setTokens]);

    const resetAuth = useCallback(() => {
        accessTokenRef.current = null;
        refreshTokenRef.current = null;
        refreshPromiseRef.current = null;
        setAccessToken(null);
        setUser(null);
        clearStorage();
    }, []);

    const updateAuthUser = useCallback((updates: Partial<AuthUser>) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...updates };
            saveUser(updated);
            return updated;
        });
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        if (refreshPromiseRef.current) return refreshPromiseRef.current;

        const refresh = refreshTokenRef.current;
        if (!refresh) {
            resetAuth();
            return null;
        }

        const promise = (async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                try {
                    const res = await fetch(`${AUTH_API}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ refresh_token: refresh }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        console.warn(`[Auth] Refresh failed with status ${res.status}`);
                        resetAuth();
                        return null;
                    }

                    const data = await res.json();
                    const newTokens: AuthTokens = {
                        access_token: data.access_token,
                        refresh_token: data.refresh_token ?? refresh,
                    };
                    setTokens(newTokens);
                    return newTokens.access_token;
                } catch (fetchError: unknown) {
                    clearTimeout(timeoutId);
                    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                        console.warn('[Auth] Refresh request timeout');
                    } else {
                        console.warn('[Auth] Refresh fetch error:', fetchError);
                    }
                    resetAuth();
                    return null;
                }
            } finally {
                refreshPromiseRef.current = null;
            }
        })();

        refreshPromiseRef.current = promise;
        return promise;
    }, [resetAuth, setTokens]);

    const apiCall = useCallback(async <T = unknown>(
        url: string,
        options: RequestInit = {},
    ): Promise<T> => {
        const token = accessTokenRef.current;
        if (!token) throw new Error('Not authenticated');

        const createSignal = () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            return { controller, timeoutId };
        };

        const doFetch = (t: string) => {
            const { controller, timeoutId } = createSignal();
            return fetch(url, {
                ...options,
                credentials: 'include',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                    Authorization: `Bearer ${t}`,
                },
            }).finally(() => clearTimeout(timeoutId));
        };

        let res = await doFetch(token);

        if (res.status === 401) {
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error('Session expired');
            res = await doFetch(newToken);
        }

        if (!res.ok) {
            const body = await res.text();
            let msg = 'Request failed';
            try {
                const j = JSON.parse(body);
                msg = j.erro || j.error || j.message || msg;
            } catch (_e) {
                console.warn(`[apiCall] Failed to parse error response from ${url}:`, body.substring(0, 200));
            }
            throw new Error(msg);
        }

        return res.json();
    }, [refreshAccessToken]);

    useEffect(() => {
        let cancelled = false;

        async function restore() {
            const tokens = loadTokens();
            const storedUser = loadUser();
            if (!tokens || !storedUser) {
                clearStorage();
                return;
            }

            accessTokenRef.current = tokens.access_token;
            refreshTokenRef.current = tokens.refresh_token;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                try {
                    const res = await fetch(`${AUTH_API}/auth/session`, {
                        headers: { Authorization: `Bearer ${tokens.access_token}` },
                        credentials: 'include',
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    if (cancelled) return;

                    if (res.ok) {
                        const data = await res.json();
                        const freshUser: AuthUser = data.user ?? storedUser;
                        setUser(freshUser);
                        setAccessToken(tokens.access_token);
                        saveUser(freshUser);
                        return;
                    }

                    if (res.status === 401) {
                        const newToken = await refreshAccessToken();
                        if (cancelled) return;
                        if (newToken) {
                            const retryController = new AbortController();
                            const retryTimeoutId = setTimeout(() => retryController.abort(), 10000);
                            try {
                                const retryRes = await fetch(`${AUTH_API}/auth/session`, {
                                    headers: { Authorization: `Bearer ${newToken}` },
                                    credentials: 'include',
                                    signal: retryController.signal,
                                });
                                clearTimeout(retryTimeoutId);
                                if (cancelled) return;
                                if (retryRes.ok) {
                                    const data = await retryRes.json();
                                    const freshUser: AuthUser = data.user ?? storedUser;
                                    setUser(freshUser);
                                    saveUser(freshUser);
                                    return;
                                }
                            } finally {
                                clearTimeout(retryTimeoutId);
                            }
                        }
                    }

                    resetAuth();
                } finally {
                    clearTimeout(timeoutId);
                }
            } catch (e) {
                if (e instanceof Error && e.name === 'AbortError') {
                    console.warn('[Auth] Session restore timeout');
                } else {
                    console.warn('[Auth] Session restore error:', e);
                }
                if (!cancelled) resetAuth();
            }
        }

        restore().finally(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => { cancelled = true; };
    }, [refreshAccessToken, resetAuth]);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const res = await fetch(`${AUTH_API}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const body = await res.text();
                let data: Record<string, unknown> = {};
                try {
                    data = JSON.parse(body);
                } catch (_parseErr) {
                    console.warn('[Auth] Failed to parse login response:', body.substring(0, 200));
                    setError('Resposta invalida do servidor');
                    setIsLoading(false);
                    return false;
                }

                if (!res.ok) {
                    const msg = (data.erro || data.error || 'Usuario ou senha invalidos') as string;
                    setError(msg);
                    setIsLoading(false);
                    return false;
                }

                if (!data.access_token || !data.user) {
                    setError('Resposta invalida do servidor.');
                    setIsLoading(false);
                    return false;
                }

                handleAuthSuccess(data as {
                    access_token: string;
                    refresh_token: string;
                    user: AuthUser;
                });
                setIsLoading(false);
                return true;
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') {
                setError('Conexao expirou. Tente novamente.');
            } else {
                console.warn('[Auth] Login error:', e);
                setError('Erro de conexao. Tente novamente.');
            }
            setIsLoading(false);
            return false;
        }
    }, [handleAuthSuccess]);

    const register = useCallback(async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const res = await fetch(`${AUTH_API}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, password }),
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                const body = await res.text();
                let data: Record<string, unknown> = {};
                try {
                    data = JSON.parse(body);
                } catch (_parseErr) {
                    console.warn('[Auth] Failed to parse register response:', body.substring(0, 200));
                    setError('Resposta invalida do servidor');
                    setIsLoading(false);
                    return false;
                }

                if (!res.ok) {
                    const msg = (data.erro || data.error || 'Erro ao criar conta') as string;
                    setError(msg);
                    setIsLoading(false);
                    return false;
                }

                if (data.access_token && data.user) {
                    handleAuthSuccess(data as {
                        access_token: string;
                        refresh_token: string;
                        user: AuthUser;
                    });
                }

                setIsLoading(false);
                return true;
            } finally {
                clearTimeout(timeoutId);
            }
        } catch (e: unknown) {
            if (e instanceof Error && e.name === 'AbortError') {
                setError('Conexao expirou. Tente novamente.');
            } else {
                console.warn('[Auth] Register error:', e);
                setError('Erro de conexao. Tente novamente.');
            }
            setIsLoading(false);
            return false;
        }
    }, [handleAuthSuccess]);

    const logout = useCallback(async () => {
        const refresh = refreshTokenRef.current;
        const access = accessTokenRef.current;
        resetAuth();

        if (access) {
            try {
                await fetch(`${AUTH_API}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${access}`,
                    },
                    credentials: 'include',
                    body: JSON.stringify({ refresh_token: refresh }),
                });
            } catch (_e) { /* best effort */ }
        }
    }, [resetAuth]);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            isLoading,
            error,
            login,
            register,
            logout,
            clearError,
            apiCall,
            updateAuthUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
