export interface Post {
    id: number;
    texto: string;
    author: string;
    parent_id?: number | null;
    likes: number;
    data_criacao: string;
    replies?: Post[];
}

export interface UserProfile {
    username: string;
    total_posts: number;
    total_likes: number;
    posts: Post[];
}

export type View =
    | { type: 'feed' }
    | { type: 'thread'; id: number }
    | { type: 'profile'; username: string };

export const API = 'https://backend-go-portal-5k1k.onrender.com/api';
export const WS_URL = 'wss://backend-go-portal-5k1k.onrender.com/ws';
export const MAX_CHARS = 280;
