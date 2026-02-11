import type { Noticia } from './types';
import { NEWS_API } from './types';

interface CacheEntry<T> {
    data: T;
    ts: number;
}

const store = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttl: number): T | null {
    const e = store.get(key);
    if (!e) return null;
    if (Date.now() - e.ts > ttl) {
        store.delete(key);
        return null;
    }
    return e.data as T;
}

function setCache<T>(key: string, data: T) {
    store.set(key, { data, ts: Date.now() });
}

function getStale<T>(key: string): T | null {
    const e = store.get(key);
    return e ? (e.data as T) : null;
}

export async function fetchNoticias(): Promise<Noticia[]> {
    const key = 'news:list';
    const cached = getCached<Noticia[]>(key, 60_000);
    if (cached) return cached;

    try {
        const res = await fetch(NEWS_API, { cache: 'no-store' });
        if (!res.ok) return getStale<Noticia[]>(key) ?? [];
        const data: Noticia[] = await res.json();
        setCache(key, data);
        return data;
    } catch {
        return getStale<Noticia[]>(key) ?? [];
    }
}

export async function fetchDestaques(): Promise<Noticia[]> {
    const key = 'news:destaques';
    const cached = getCached<Noticia[]>(key, 60_000);
    if (cached) return cached;

    try {
        const res = await fetch(`${NEWS_API}/destaques`, { cache: 'no-store' });
        if (!res.ok) return getStale<Noticia[]>(key) ?? [];
        const data: Noticia[] = await res.json();
        setCache(key, data);
        return data;
    } catch {
        return getStale<Noticia[]>(key) ?? [];
    }
}

export async function fetchNoticia(id: number): Promise<Noticia | null> {
    const key = `news:${id}`;
    const cached = getCached<Noticia>(key, 120_000);
    if (cached) return cached;

    try {
        const res = await fetch(`${NEWS_API}/${id}`, { cache: 'no-store' });
        if (!res.ok) return getStale<Noticia>(key);
        const data: Noticia = await res.json();
        setCache(key, data);
        return data;
    } catch {
        return getStale<Noticia>(key);
    }
}
