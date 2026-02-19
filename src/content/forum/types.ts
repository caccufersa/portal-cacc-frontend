export interface Post {
    id: number;
    texto: string;
    author: string;
    user_id: number;
    parent_id?: number | null;
    likes: number;
    liked: boolean; // [NOVO]
    reply_count: number;
    created_at: string;
    replies: Post[];
}

export interface UserProfile {
    username: string;
    total_posts: number;
    total_likes: number;
    posts: Post[];
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
