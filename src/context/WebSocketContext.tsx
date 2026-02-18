'use client';

/* ------------------------------------------------------------------ */
/*  WebSocketContext – integra o WebSocketService com React + Auth     */
/* ------------------------------------------------------------------ */

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactNode,
} from 'react';
import { WebSocketService } from '@/lib/websocket/WebSocketService';
import { useAuth } from '@/context/AuthContext';
import type { ConnectionStatus, WSHandler, WSMessage } from '@/lib/websocket/types';

interface WebSocketContextType {
    status: ConnectionStatus;
    subscribe: (type: string, handler: WSHandler) => () => void;
    send: (msg: Record<string, unknown>) => void;
    sendAction: <T = unknown>(action: string, data?: Record<string, unknown>, timeoutMs?: number) => Promise<T>;
    lastMessage: WSMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const { accessToken, logout } = useAuth();
    const [status, setStatus] = useState<ConnectionStatus>('offline');
    const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
    const serviceRef = useRef<WebSocketService | null>(null);

    // Inicializa o singleton uma vez
    useEffect(() => {
        const svc = WebSocketService.getInstance();
        serviceRef.current = svc;

        // Configura callback de erro de auth para forçar logout
        svc.updateOptions({
            onAuthError: () => {
                logout();
            },
        });

        // Escuta mudanças de status
        const unsub = svc.onStatusChange(setStatus);

        // Wildcard listener para lastMessage
        const unsubWild = svc.subscribe('*', (msg) => {
            setLastMessage(msg);
        });

        return () => {
            unsub();
            unsubWild();
        };
    }, [logout]);

    // Conecta/desconecta ao mudar o token
    useEffect(() => {
        const svc = serviceRef.current;
        if (!svc) return;

        if (accessToken) {
            svc.connect(accessToken);
        } else {
            svc.disconnect();
        }
    }, [accessToken]);

    const subscribe = useCallback(
        (type: string, handler: WSHandler) => {
            const svc = serviceRef.current;
            if (!svc) return () => {};
            return svc.subscribe(type, handler);
        },
        [],
    );

    const send = useCallback(
        (msg: Record<string, unknown>) => {
            serviceRef.current?.send(msg);
        },
        [],
    );

    const sendAction = useCallback(
        <T = unknown,>(action: string, data: Record<string, unknown> = {}, timeoutMs?: number): Promise<T> => {
            const svc = serviceRef.current;
            if (!svc) return Promise.reject(new Error('WebSocket not ready'));
            return svc.sendAction<T>(action, data, timeoutMs);
        },
        [],
    );

    return (
        <WebSocketContext.Provider value={{ status, subscribe, send, sendAction, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
}

/**
 * Acesso direto ao contexto WebSocket.
 * Para subscrição por tipo, prefira `useWebSocket(type, handler)`.
 */
export function useWebSocketContext(): WebSocketContextType {
    const ctx = useContext(WebSocketContext);
    if (!ctx) {
        throw new Error('useWebSocketContext must be used within <WebSocketProvider>');
    }
    return ctx;
}
