'use client';

import { useEffect, useRef } from 'react';
import { useWebSocketContext } from '@/context/WebSocketContext';
import type { ConnectionStatus, WSHandler, WSMessage } from './types';

/**
 * Hook que inscreve um handler para um `type` específico de WSMessage.
 *
 * @param type   Tipo de evento (ex.: `'new_post'`) ou `'*'` para todos.
 * @param handler Callback chamado a cada mensagem daquele tipo.
 * @returns `{ status, send, lastMessage }`
 *
 * @example
 * ```tsx
 * function ForumLive() {
 *     const { status } = useWebSocket('new_post', (msg) => {
 *         console.log('Novo post:', msg.data);
 *     });
 *     return <span>WS: {status}</span>;
 * }
 * ```
 */
export function useWebSocket(
    type: string,
    handler: WSHandler,
): { status: ConnectionStatus; send: (msg: Record<string, unknown>) => void; sendAction: <T = unknown>(action: string, data?: Record<string, unknown>, timeoutMs?: number) => Promise<T>; lastMessage: WSMessage | null } {
    const { status, subscribe, send, sendAction, lastMessage } = useWebSocketContext();

    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    useEffect(() => {
        const unsub = subscribe(type, (msg) => handlerRef.current(msg));
        return unsub;
    }, [type, subscribe]);

    return { status, send, sendAction, lastMessage };
}
