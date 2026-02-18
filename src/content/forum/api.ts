import type { Post, UserProfile, LikeResult, DeleteResult } from './types';
import { setCache, invalidate, getStale, getCached } from './cache';
import { WebSocketService } from '@/lib/websocket/WebSocketService';

function getWs(): WebSocketService | null {
    const ws = WebSocketService.getInstance();
    return ws.status === 'connected' ? ws : null;
}

async function wsQuery<T>(
    cacheKey: string,
    action: string,
    data: Record<string, unknown>,
    ttl: number,
): Promise<T | null> {
    const cached = getCached<T>(cacheKey, ttl);
    if (cached) return cached;

    const ws = getWs();
    if (!ws) return getStale<T>(cacheKey);

    try {
        const result = await ws.sendAction<T>(action, data, 12_000);
        if (result != null) setCache(cacheKey, result);
        return result;
    } catch {
        return getStale<T>(cacheKey);
    }
}

async function wsMutate<T>(
    action: string,
    data: Record<string, unknown>,
    timeoutMs = 8_000,
): Promise<T | null> {
    const ws = getWs();
    if (!ws) return null;

    try {
        return await ws.sendAction<T>(action, data, timeoutMs);
    } catch {
        return null;
    }
}

export async function fetchPosts(limit = 30, offset = 0): Promise<Post[]> {
    const key = `feed:${limit}:${offset}`;
    const data = await wsQuery<Post[]>(key, 'social.feed', { limit, offset }, 15_000);
    return Array.isArray(data) ? data : [];
}

export async function fetchThread(postId: number): Promise<Post | null> {
    return wsQuery<Post>(`thread:${postId}`, 'social.thread', { id: postId }, 30_000);
}

export async function fetchProfile(username: string): Promise<UserProfile | null> {
    const ws = getWs();
    if (!ws) return null;
    try {
        return await ws.sendAction<UserProfile>('social.profile', { username }, 12_000);
    } catch {
        return null;
    }
}

export async function fetchOwnProfile(): Promise<UserProfile | null> {
    const ws = getWs();
    if (!ws) return null;
    try {
        return await ws.sendAction<UserProfile>('social.profile', {}, 12_000);
    } catch {
        return null;
    }
}

export async function createPost(texto: string): Promise<Post | null> {
    const post = await wsMutate<Post>('social.post.create', { texto });
    invalidate('feed:*');
    return post;
}

export async function createComment(postId: number, texto: string): Promise<Post | null> {
    const comment = await wsMutate<Post>('social.post.comment', {
        parent_id: postId,
        texto,
    });
    invalidate(`thread:${postId}`);
    invalidate('feed:*');
    return comment;
}

export async function likePost(postId: number): Promise<LikeResult | null> {
    return wsMutate<LikeResult>('social.post.like', { id: postId }, 6_000);
}

export async function unlikePost(postId: number): Promise<LikeResult | null> {
    return wsMutate<LikeResult>('social.post.unlike', { id: postId }, 6_000);
}

export async function deletePost(postId: number): Promise<DeleteResult | null> {
    const result = await wsMutate<DeleteResult>('social.post.delete', { id: postId });
    invalidate('feed:*');
    invalidate(`thread:${postId}`);
    return result;
}

export function patchPostLikes(postId: number, delta: number): void {
    for (const [key, entry] of Array.from(getCacheEntries())) {
        if (!key.startsWith('feed:')) continue;
        const feed = entry as Post[];
        if (!Array.isArray(feed)) continue;
        const updated = feed.map(p =>
            p.id === postId ? { ...p, likes: Math.max(0, p.likes + delta) } : p,
        );
        setCache(key, updated);
    }
}

function getCacheEntries(): [string, unknown][] {
    const stale: [string, unknown][] = [];
    const keys = ['feed:30:0', 'feed:50:0'];
    for (const k of keys) {
        const d = getStale<unknown>(k);
        if (d) stale.push([k, d]);
    }
    return stale;
}
