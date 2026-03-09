import type { NotificationItem, NotificationListParams } from './types';

type HttpMethod = 'GET' | 'PUT';

interface RequestOptions {
    method?: HttpMethod;
    token: string;
}

function normalizeLimit(limit?: number): number | undefined {
    if (limit == null || !Number.isFinite(limit)) return undefined;
    return Math.min(50, Math.max(1, Math.trunc(limit)));
}

function normalizeOffset(offset?: number): number | undefined {
    if (offset == null || !Number.isFinite(offset)) return undefined;
    return Math.max(0, Math.trunc(offset));
}

async function apiRequest<T>(url: string, options: RequestOptions): Promise<T> {
    const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
            Authorization: `Bearer ${options.token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        let message = 'Erro inesperado';
        try {
            const data = (await response.json()) as { erro?: string; error?: string; message?: string };
            message = data.erro ?? data.error ?? data.message ?? message;
        } catch {
            // ignore parse error
        }
        throw new Error(message);
    }

    return (await response.json()) as T;
}

export class NotificationService {
    constructor(private readonly apiBaseUrl: string) {}

    async list(token: string, params?: NotificationListParams): Promise<NotificationItem[]> {
        const query = new URLSearchParams();
        const limit = normalizeLimit(params?.limit);
        const offset = normalizeOffset(params?.offset);

        if (limit != null) query.set('limit', String(limit));
        if (offset != null) query.set('offset', String(offset));

        const url = `${this.apiBaseUrl}/notifications${query.toString() ? `?${query.toString()}` : ''}`;
        const data = await apiRequest<NotificationItem[] | null>(url, { token, method: 'GET' });
        return Array.isArray(data) ? data : [];
    }

    async markAllAsRead(token: string): Promise<void> {
        await apiRequest<{ status: 'ok' }>(`${this.apiBaseUrl}/notifications/read`, {
            token,
            method: 'PUT',
        });
    }
}
