'use client';

import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import type { Post } from './types';

export interface ForumSocketCallbacks {
    onNewPost: (post: Post) => void;
    onLikeUpdate: (postId: number, likes: number) => void;
    onNewComment: (parentId: number, comment: Post) => void;
    onPostDeleted: (postId: number) => void;
}

export function useForumSocket(callbacks: ForumSocketCallbacks) {
    const cbRef = useRef(callbacks);
    useEffect(() => {
        cbRef.current = callbacks;
    });

    const { status, sendAction } = useWebSocket('new_post', (msg) => {
        if (msg.data && typeof msg.data === 'object' && 'id' in msg.data) {
            cbRef.current.onNewPost(msg.data as Post);
        }
    });

    useWebSocket('like_updated', (msg) => {
        if (msg.data && typeof msg.data === 'object') {
            const d = msg.data as Record<string, unknown>;
            if (typeof d.post_id === 'number' && typeof d.likes === 'number') {
                cbRef.current.onLikeUpdate(d.post_id, d.likes);
            }
        }
    });

    useWebSocket('new_comment', (msg) => {
        if (msg.data && typeof msg.data === 'object') {
            const comment = msg.data as Post;
            if (typeof comment.parent_id === 'number') {
                cbRef.current.onNewComment(comment.parent_id, comment);
            }
        }
    });

    useWebSocket('post_deleted', (msg) => {
        if (msg.data && typeof msg.data === 'object') {
            const d = msg.data as Record<string, unknown>;
            if (typeof d.id === 'number') {
                cbRef.current.onPostDeleted(d.id);
            }
        }
    });

    return {
        connected: status === 'connected',
        sendAction,
    };
}
