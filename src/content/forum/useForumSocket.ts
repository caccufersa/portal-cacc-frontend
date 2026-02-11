'use client';

import { useEffect, useRef, useState } from 'react';
import { WS_URL } from './types';
import type { Post } from './types';

export interface WsMessage {
    type: 'new_post' | 'new_comment' | 'like_update';
    post?: Post;
    post_id?: number;
    parent_id?: number;
    likes?: number;
    comment?: Post;
}

export function useForumSocket(
    enabled: boolean,
    onNewPost: (post: Post) => void,
    onLikeUpdate: (postId: number, likes: number) => void,
    onNewComment: (parentId: number, comment: Post) => void,
) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const mountedRef = useRef(true);

    const onNewPostRef = useRef(onNewPost);
    const onLikeUpdateRef = useRef(onLikeUpdate);
    const onNewCommentRef = useRef(onNewComment);

    useEffect(() => {
        onNewPostRef.current = onNewPost;
        onLikeUpdateRef.current = onLikeUpdate;
        onNewCommentRef.current = onNewComment;
    }, [onNewPost, onLikeUpdate, onNewComment]);

    useEffect(() => {
        if (!enabled) return;
        mountedRef.current = true;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

        function connect() {
            if (!mountedRef.current) return;
            if (wsRef.current && wsRef.current.readyState <= 1) return;

            try {
                const ws = new WebSocket(WS_URL);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (mountedRef.current) setConnected(true);
                };

                ws.onclose = () => {
                    if (mountedRef.current) {
                        setConnected(false);
                        reconnectTimer = setTimeout(connect, 3000);
                    }
                };

                ws.onerror = () => { ws.close(); };

                ws.onmessage = (ev) => {
                    try {
                        const msg: WsMessage = JSON.parse(ev.data);
                        if (msg.type === 'new_post' && msg.post) {
                            onNewPostRef.current(msg.post);
                        } else if (msg.type === 'like_update' && msg.post_id != null && msg.likes != null) {
                            onLikeUpdateRef.current(msg.post_id, msg.likes);
                        } else if (msg.type === 'new_comment' && msg.parent_id != null && msg.comment) {
                            onNewCommentRef.current(msg.parent_id, msg.comment);
                        }
                    } catch { /* ignore */ }
                };
            } catch { /* ignore */ }
        }

        connect();

        return () => {
            mountedRef.current = false;
            clearTimeout(reconnectTimer);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [enabled]);

    return connected;
}
