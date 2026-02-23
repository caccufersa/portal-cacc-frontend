export interface Post {
    id: number;
    texto: string;
    author: string;
    author_name: string;
    user_id: number;
    parent_id?: number | null;
    repost_id?: number;
    avatar_url?: string;
    likes: number;
    liked: boolean;
    reply_count: number;
    created_at: string;
    replies?: Post[];
}

export interface UserProfile {
    username: string;
    display_name: string;
    bio: string;
    avatar_url?: string;
    total_posts: number;
    total_likes: number;
    posts: Post[];
}

export interface Notification {
    id: number;
    user_id: number;
    actor_id: number;
    actor_name: string;
    actor_avatar: string;
    type: 'like' | 'reply' | 'mention' | 'repost';
    post_id: number;
    is_read: boolean;
    created_at: string;
}

export interface LikeResult {
    post_id: number;
    likes: number;
}

export interface DeleteResult {
    id: number;
    status: string;
}

export type View =
    | { type: 'feed' }
    | { type: 'thread'; id: number }
    | { type: 'profile'; username: string };

export const MAX_CHARS = 5000;
