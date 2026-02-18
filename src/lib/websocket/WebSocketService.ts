import {
    ConnectionStatus,
    DEFAULT_WS_URL,
    WSHandler,
    WSMessage,
    WebSocketServiceOptions,
} from './types';

const DEFAULT_BACKOFF = [1_000, 2_000, 5_000, 10_000];
const DEFAULT_HEARTBEAT_MS = 30_000;

export class WebSocketService {
    private static instance: WebSocketService | null = null;

    static getInstance(opts?: WebSocketServiceOptions): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService(opts);
        }
        return WebSocketService.instance;
    }

    static resetInstance(): void {
        WebSocketService.instance?.disconnect();
        WebSocketService.instance = null;
    }

    private ws: WebSocket | null = null;
    private token: string | null = null;
    private url: string;
    private backoffMs: number[];
    private heartbeatIntervalMs: number;
    private onAuthError?: () => void;

    private _status: ConnectionStatus = 'offline';
    private statusListeners = new Set<(s: ConnectionStatus) => void>();


    private subs = new Map<string, Set<WSHandler>>();
    private wildcardSubs = new Set<WSHandler>();

    private pendingActions = new Map<string, {
        resolve: (v: unknown) => void;
        reject: (e: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    }>();

    private reconnectAttempt = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private intentionalClose = false;

    private constructor(opts?: WebSocketServiceOptions) {
        this.url = opts?.url ?? DEFAULT_WS_URL;
        this.backoffMs = opts?.backoffMs ?? DEFAULT_BACKOFF;
        this.heartbeatIntervalMs = opts?.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_MS;
        this.onAuthError = opts?.onAuthError;
    }

    get status(): ConnectionStatus {
        return this._status;
    }

    connect(jwt: string): void {
        if (!jwt) return;
        this.token = jwt;
        this.intentionalClose = false;
        this.doConnect();
    }

    disconnect(): void {
        this.intentionalClose = true;
        this.clearTimers();
        // Reject all pending actions
        this.pendingActions.forEach((p) => {
            clearTimeout(p.timer);
            p.reject(new Error('WebSocket disconnected'));
        });
        this.pendingActions.clear();
        this.ws?.close();
        this.ws = null;
        this.token = null;
        this.setStatus('offline');
    }

    subscribe(type: string, handler: WSHandler): () => void {
        if (type === '*') {
            this.wildcardSubs.add(handler);
            return () => { this.wildcardSubs.delete(handler); };
        }
        let set = this.subs.get(type);
        if (!set) {
            set = new Set();
            this.subs.set(type, set);
        }
        set.add(handler);
        return () => {
            set!.delete(handler);
            if (set!.size === 0) this.subs.delete(type);
        };
    }

    send(msg: Record<string, unknown>): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    /**
     * Send a service action and await the reply (request/response pattern).
     * Returns a Promise that resolves with `data` from the reply envelope.
     */
    sendAction<T = unknown>(
        action: string,
        data: Record<string, unknown> = {},
        timeoutMs = 15_000,
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const id = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : Math.random().toString(16).slice(2, 10);
            const envelope = { id, action, service: 'social', data };

            const timer = setTimeout(() => {
                this.pendingActions.delete(id);
                reject(new Error(`Timeout for ${action}`));
            }, timeoutMs);

            this.pendingActions.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
            this.ws.send(JSON.stringify(envelope));
        });
    }

    onStatusChange(fn: (s: ConnectionStatus) => void): () => void {
        this.statusListeners.add(fn);
        return () => { this.statusListeners.delete(fn); };
    }

    updateOptions(opts: Partial<WebSocketServiceOptions>): void {
        if (opts.url !== undefined) this.url = opts.url;
        if (opts.backoffMs !== undefined) this.backoffMs = opts.backoffMs;
        if (opts.heartbeatIntervalMs !== undefined) this.heartbeatIntervalMs = opts.heartbeatIntervalMs;
        if (opts.onAuthError !== undefined) this.onAuthError = opts.onAuthError;
    }

    private setStatus(s: ConnectionStatus): void {
        if (this._status === s) return;
        this._status = s;
        this.statusListeners.forEach((fn) => fn(s));
    }

    private doConnect(): void {
        if (this.ws) {
            this.ws.onclose = null; // evita loop de reconexão
            this.ws.close();
            this.ws = null;
        }

        if (!this.token) return;
        this.setStatus('connecting');

        // SEGURANÇA: token vai APENAS na query string, nunca é logado
        const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`;
        try {
            this.ws = new WebSocket(wsUrl);
        } catch {
            // ignore connection error
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = this.handleOpen;
        this.ws.onclose = this.handleClose;
        this.ws.onerror = this.handleError;
        this.ws.onmessage = this.handleMessage;
    }

    private handleOpen = (): void => {
        this.reconnectAttempt = 0;
        this.setStatus('connected');
        this.startHeartbeat();
    };

    private handleClose = (ev: CloseEvent): void => {
        this.clearTimers();
        this.setStatus('offline');

        // 4001 ou 4003 → token inválido / expirado
        if (ev.code === 4001 || ev.code === 4003 || ev.code === 1008) {
            this.onAuthError?.();
            return; // não tenta reconectar
        }

        if (!this.intentionalClose) {
            this.scheduleReconnect();
        }
    };

    private handleError = (): void => {
        this.ws?.close();
    };

    private handleMessage = (ev: MessageEvent): void => {
        let raw: Record<string, unknown>;
        try {
            raw = JSON.parse(ev.data as string);
        } catch {
            return;
        }

        const replyTo = raw.reply_to as string | undefined;
        if (replyTo && this.pendingActions.has(replyTo)) {
            const pending = this.pendingActions.get(replyTo)!;
            this.pendingActions.delete(replyTo);
            clearTimeout(pending.timer);
            if (raw.error) {
                const errObj = raw.error as { message?: string; code?: number };
                pending.reject(new Error(errObj.message ?? String(raw.error)));
            } else {
                pending.resolve(raw.data);
            }
            return;
        }

        const action = raw.action as string;
        if (!action || action === 'pong') return;

        const msg = raw as unknown as WSMessage;
        const set = this.subs.get(action);
        if (set) {
            set.forEach((fn) => {
                try { fn(msg); } catch {}
            });
        }

        this.wildcardSubs.forEach((fn) => {
            try { fn(msg); } catch {}
        });
    };

    /* ---- reconnect / heartbeat ----------------------------------- */

    private scheduleReconnect(): void {
        if (this.intentionalClose || !this.token) return;
        const delay =
            this.backoffMs[Math.min(this.reconnectAttempt, this.backoffMs.length - 1)];
        this.reconnectAttempt++;
        this.setStatus('connecting');
        this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
    }

    private startHeartbeat(): void {
        this.clearHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            this.send({ id: 'ping', action: 'ping', service: 'system' });
        }, this.heartbeatIntervalMs);
    }

    private clearHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private clearTimers(): void {
        this.clearHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
