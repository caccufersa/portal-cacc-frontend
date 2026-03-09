'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationService } from './NotificationService';
import type { NotificationItem } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

const service = new NotificationService(API_BASE_URL);

interface RefreshOptions {
    markAsRead?: boolean;
}

interface UseNotificationsOptions {
    limit?: number;
    autoFetch?: boolean;
}

function getUnreadCount(items: NotificationItem[]): number {
    return items.reduce((total, item) => (item.is_read ? total : total + 1), 0);
}

function sortByDateDesc(items: NotificationItem[]): NotificationItem[] {
    return [...items].sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    );
}

export function useNotifications(options: UseNotificationsOptions = {}) {
    const { accessToken, user } = useAuth();
    const limit = options.limit ?? 20;
    const autoFetch = options.autoFetch ?? true;

    const [items, setItems] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setItems([]);
        setUnreadCount(0);
        setOffset(0);
        setHasMore(false);
        setError(null);
    }, []);

    const refresh = useCallback(async (refreshOptions: RefreshOptions = {}) => {
        if (!accessToken || !user) {
            resetState();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const list = await service.list(accessToken, { limit, offset: 0 });
            const sorted = sortByDateDesc(list);

            if (refreshOptions.markAsRead) {
                setItems(sorted.map((item) => ({ ...item, is_read: true })));
                setUnreadCount(0);
            } else {
                setItems(sorted);
                setUnreadCount(getUnreadCount(sorted));
            }

            setOffset(sorted.length);
            setHasMore(sorted.length >= limit);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    }, [accessToken, limit, resetState, user]);

    const loadMore = useCallback(async () => {
        if (!accessToken || !user || loadingMore || loading || !hasMore) return;

        setLoadingMore(true);
        setError(null);

        try {
            const nextPage = await service.list(accessToken, { limit, offset });
            const mergedMap = new Map<number, NotificationItem>();

            for (const item of items) {
                mergedMap.set(item.id, item);
            }
            for (const item of nextPage) {
                mergedMap.set(item.id, item);
            }

            const merged = sortByDateDesc(Array.from(mergedMap.values()));
            setItems(merged);
            setUnreadCount(getUnreadCount(merged));
            setOffset(offset + nextPage.length);
            setHasMore(nextPage.length >= limit);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar mais notificações');
        } finally {
            setLoadingMore(false);
        }
    }, [accessToken, hasMore, items, limit, loading, loadingMore, offset, user]);

    const markAllAsRead = useCallback(async () => {
        if (!accessToken || !user) return;

        setError(null);
        try {
            await service.markAllAsRead(accessToken);
            setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar notificações');
        }
    }, [accessToken, user]);

    useEffect(() => {
        if (!autoFetch) return;
        void refresh();
    }, [autoFetch, refresh]);

    useEffect(() => {
        if (!user || !accessToken) {
            resetState();
        }
    }, [accessToken, resetState, user]);

    return useMemo(() => ({
        items,
        unreadCount,
        hasMore,
        loading,
        loadingMore,
        error,
        refresh,
        loadMore,
        markAllAsRead,
    }), [error, hasMore, items, loadMore, loading, loadingMore, markAllAsRead, refresh, unreadCount]);
}
