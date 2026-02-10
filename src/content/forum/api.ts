import { API } from './types';
import type { Post, UserProfile } from './types';
import { cachedFetch, setCache, invalidate, getStale } from './cache';

export async function fetchPosts(): Promise<Post[]> {
    const data = await cachedFetch<Post[]>('feed', `${API}/posts`, 15_000);
    return Array.isArray(data) ? data : [];
}

export async function fetchThread(postId: number): Promise<Post | null> {
    return cachedFetch<Post>(`thread:${postId}`, `${API}/posts/${postId}`, 20_000);
}

export async function fetchProfile(username: string): Promise<UserProfile | null> {
    return cachedFetch<UserProfile>(
        `profile:${username}`,
        `${API}/users/${encodeURIComponent(username)}`,
        60_000,
    );
}

export async function createPost(texto: string, author: string, token: string): Promise<Post | null> {
    try {
        const res = await fetch(`${API}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ texto, author }),
        });
        if (!res.ok) return null;
        const post: Post = await res.json();
        invalidate('feed');
        return post;
    } catch {
        return null;
    }
}

export async function createComment(
    postId: number,
    texto: string,
    author: string,
    token: string,
): Promise<boolean> {
    try {
        const res = await fetch(`${API}/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ texto, author }),
        });
        if (res.ok) {
            invalidate(`thread:${postId}`);
            invalidate('feed');
        }
        return res.ok;
    } catch {
        return false;
    }
}

export async function toggleLikeApi(postId: number, liked: boolean, token: string): Promise<boolean> {
    try {
        const res = await fetch(`${API}/posts/${postId}/like`, {
            method: liked ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
    } catch {
        return false;
    }
}

export function patchPostLikes(postId: number, delta: number): void {
    const feed = getStale<Post[]>('feed');
    if (feed) {
        const updated = feed.map(p =>
            p.id === postId ? { ...p, likes: Math.max(0, p.likes + delta) } : p,
        );
        setCache('feed', updated);
    }
}
