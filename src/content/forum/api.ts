import type { Post, UserProfile, LikeResult, DeleteResult } from './types';
import { setCache, invalidate, getStale, getCached } from './cache';
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

const AUTH_API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

function getCacheEntries(): [string, unknown][] {
    const stale: [string, unknown][] = [];
    const keys = ['feed:30:0', 'feed:50:0'];
    for (const k of keys) {
        const d = getStale<unknown>(k);
        if (d) stale.push([k, d]);
    }
    return stale;
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

export function useForumApi() {
    const { apiCall } = useAuth();

    const fetchPosts = useCallback(async (limit = 30, offset = 0): Promise<Post[]> => {
        const key = `feed:${limit}:${offset}`;
        const cached = getCached<Post[]>(key, 15_000);
        if (cached) return cached;

        try {
            const data = await apiCall<Post[]>(`${AUTH_API}/social/feed?limit=${limit}&offset=${offset}`);
            const result = Array.isArray(data) ? data : [];
            setCache(key, result);
            return result;
        } catch {
            const stale = getStale<Post[]>(key);
            return stale || [];
        }
    }, [apiCall]);

    const fetchThread = useCallback(async (postId: number): Promise<Post | null> => {
        const key = `thread:${postId}`;
        const cached = getCached<Post>(key, 30_000);
        if (cached) return cached;

        try {
            const data = await apiCall<Post>(`${AUTH_API}/social/feed/${postId}`);
            setCache(key, data);
            return data;
        } catch {
            return getStale<Post>(key) || null;
        }
    }, [apiCall]);

    const fetchProfile = useCallback(async (username: string): Promise<UserProfile | null> => {
        try {
            return await apiCall<UserProfile>(`${AUTH_API}/social/profile/${username}`);
        } catch {
            return null;
        }
    }, [apiCall]);

    const fetchOwnProfile = useCallback(async (): Promise<UserProfile | null> => {
        try {
            return await apiCall<UserProfile>(`${AUTH_API}/social/profile`);
        } catch {
            return null;
        }
    }, [apiCall]);

    const createPost = useCallback(async (texto: string): Promise<Post | null> => {
        try {
            const post = await apiCall<Post>(`${AUTH_API}/social/feed`, {
                method: 'POST',
                body: JSON.stringify({ texto }),
            });
            invalidate('feed:*');
            return post;
        } catch {
            return null;
        }
    }, [apiCall]);

    const createComment = useCallback(async (postId: number, texto: string): Promise<Post | null> => {
        try {
            const comment = await apiCall<Post>(`${AUTH_API}/social/feed/${postId}/reply`, {
                method: 'POST',
                body: JSON.stringify({ texto }),
            });
            invalidate(`thread:${postId}`);
            invalidate('feed:*');
            return comment;
        } catch {
            return null;
        }
    }, [apiCall]);

    const likePost = useCallback(async (postId: number): Promise<LikeResult | null> => {
        try {
            return await apiCall<LikeResult>(`${AUTH_API}/social/feed/${postId}/like`, {
                method: 'PUT',
            });
        } catch {
            return null;
        }
    }, [apiCall]);

    const unlikePost = useCallback(async (postId: number): Promise<LikeResult | null> => {
        try {
            return await apiCall<LikeResult>(`${AUTH_API}/social/feed/${postId}/like`, {
                method: 'DELETE',
            });
        } catch {
            return null;
        }
    }, [apiCall]);

    const deletePost = useCallback(async (postId: number): Promise<DeleteResult | null> => {
        try {
            const result = await apiCall<DeleteResult>(`${AUTH_API}/social/feed/${postId}`, {
                method: 'DELETE',
            });
            invalidate('feed:*');
            invalidate(`thread:${postId}`);
            return result;
        } catch {
            return null;
        }
    }, [apiCall]);

    const createRepost = useCallback(async (postId: number): Promise<Post | null> => {
        try {
            const post = await apiCall<Post>(`${AUTH_API}/social/feed/${postId}/repost`, {
                method: 'POST',
            });
            invalidate('feed:*');
            return post;
        } catch {
            return null;
        }
    }, [apiCall]);

    const updateProfile = useCallback(async (data: { display_name: string; bio: string; avatar_url: string }): Promise<boolean> => {
        try {
            await apiCall(`${AUTH_API}/social/profile`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            return true;
        } catch {
            return false;
        }
    }, [apiCall]);

    return {
        fetchPosts,
        fetchThread,
        fetchProfile,
        fetchOwnProfile,
        createPost,
        createComment,
        likePost,
        unlikePost,
        deletePost,
        createRepost,
        updateProfile,
    };
}
