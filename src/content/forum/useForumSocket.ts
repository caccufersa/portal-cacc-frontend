'use client';

import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import type { Post } from './types';

export interface ForumSocketCallbacks {
    onNewPost: (post: Post) => void;
    onLikeUpdate: (postId: number, likes: number) => void;
    onNewComment: (parentId: number, comment: Post) => void;
    onNewReply: (parentId: number, reply: Post) => void;
    onPostDeleted: (postId: number) => void;
}

export function useForumSocket(callbacks: ForumSocketCallbacks) {
    const cbRef = useRef(callbacks);
    useEffect(() => {
        cbRef.current = callbacks;
    });

    // new_post — someone posted to the feed
    const { status, sendAction } = useWebSocket('new_post', (msg) => {
        if (msg.data && typeof msg.data === 'object' && 'id' in msg.data) {
            cbRef.current.onNewPost(msg.data as Post);
        }
    });

    // like_updated — aggregated like count changed
    useWebSocket('like_updated', (msg) => {
        if (msg.data && typeof msg.data === 'object') {
            const d = msg.data as Record<string, unknown>;
            if (typeof d.post_id === 'number' && typeof d.likes === 'number') {
                cbRef.current.onLikeUpdate(d.post_id, d.likes);
            }
        }
    });

    // new_comment — backend event name used by CreateReply broadcast ("new_reply")
    // We handle BOTH event names for backwards compatibility
    const handleReplyMsg = (msg: { data?: unknown }) => {
        if (!msg.data || typeof msg.data !== 'object') return;
        const raw = msg.data as Record<string, unknown>;

        // Backend sends: { reply: Post, parent_id: number }
        if (raw.reply && typeof raw.parent_id === 'number') {
            const reply = raw.reply as Post;
            cbRef.current.onNewReply(raw.parent_id as number, reply);
            cbRef.current.onNewComment(raw.parent_id as number, reply);
            return;
        }

        // Legacy / alternate shape: Post with parent_id embedded
        const comment = msg.data as Post;
        if (typeof comment.parent_id === 'number') {
            cbRef.current.onNewComment(comment.parent_id, comment);
            cbRef.current.onNewReply(comment.parent_id, comment);
        }
    };

    useWebSocket('new_comment', handleReplyMsg);
    useWebSocket('new_reply', handleReplyMsg);   // ← backend uses this event name in CreateReply

    // post_deleted
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
