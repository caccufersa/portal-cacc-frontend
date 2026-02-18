export type ConnectionStatus = 'connected' | 'connecting' | 'offline';

export type WSEventType =
    | 'new_post'
    | 'new_comment'
    | 'like_updated'
    | 'post_deleted'
    | 'pong'
    | (string & {});

export interface WSMessage {
    action: WSEventType;
    reply_to?: string;
    service?: string;
    user_id?: number;
    user_uuid?: string;
    username?: string;
    data: unknown;
    ts?: number;
}

export type WSHandler = (message: WSMessage) => void;

export interface WebSocketServiceOptions {
    url?: string;
    backoffMs?: number[];
    heartbeatIntervalMs?: number;
    onAuthError?: () => void;
}

export const DEFAULT_WS_URL =
    process.env.NEXT_PUBLIC_WS_URL ?? 'wss://backend-go-portal-u9o8.onrender.com/ws';
