'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Post } from './types';
import { MAX_CHARS } from './types';
import { useForumApi } from './api';
import { timeAgo, avatarLetter } from './helpers';
import { SkeletonPost } from './Skeletons';
import { useWebSocket } from '@/lib/websocket';
import LikeButton from './LikeButton';
import s from '../Forum.module.css';

let optimisticId = -1;

export default function ThreadView({
    postId,
    onBack,
    username,
    currentUserAvatar,
    onOpenProfile,
}: {
    postId: number;
    onBack: () => void;
    username: string;
    currentUserAvatar?: string;
    onOpenProfile: (username: string) => void;
}) {
    const [thread, setThread] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const repliesEndRef = useRef<HTMLDivElement>(null);
    const [entering, setEntering] = useState(true);
    const [likingId, setLikingId] = useState<number | null>(null);
    const { fetchThread: apiFetchThread, createComment, likePost, unlikePost } = useForumApi();

    useEffect(() => {
        requestAnimationFrame(() => setEntering(false));
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        apiFetchThread(postId).then(data => {
            if (!active) return;
            if (data) setThread(data);
            setLoading(false);
        });
        return () => { active = false; };
    }, [postId, apiFetchThread]);

    // Listen for real-time replies from other users
    const threadRef = useRef(thread);
    useEffect(() => { threadRef.current = thread; }, [thread]);
    const postIdRef = useRef(postId);
    useEffect(() => { postIdRef.current = postId; }, [postId]);

    useWebSocket('new_reply', (msg) => {
        if (!msg.data || typeof msg.data !== 'object') return;
        const raw = msg.data as Record<string, unknown>;

        // Backend shape: { reply: Post, parent_id: number }
        const parentId = typeof raw.parent_id === 'number' ? raw.parent_id : null;
        const incoming = raw.reply as Post | undefined ?? msg.data as Post;
        const effectiveParentId = parentId ?? incoming.parent_id;

        if (effectiveParentId !== postIdRef.current) return; // not our thread

        setThread(prev => {
            if (!prev) return prev;
            const replies = prev.replies || [];
            if (replies.some(r => r.id === incoming.id)) return prev; // dedup
            // Replace matching optimistic reply (same text + same author) if exists
            const withoutOptimistic = replies.filter(r =>
                r.id >= 0 ||
                !(r.texto === incoming.texto && r.author === incoming.author)
            );
            return {
                ...prev,
                reply_count: prev.reply_count + 1,
                replies: [...withoutOptimistic, { ...incoming, id: incoming.id }],
            };
        });

        // Scroll to new reply
        requestAnimationFrame(() => {
            repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const handleReply = useCallback(async () => {
        if (!replyText.trim() || sending) return;
        setSending(true);

        const text = replyText.trim();
        const tempId = optimisticId--;
        const optimisticReply: Post = {
            id: tempId,
            texto: text,
            author: username,
            author_name: username, // Fallback since we don't have AuthUser here directly, but the server will fix it
            avatar_url: currentUserAvatar,
            user_id: 0,
            parent_id: postId,
            repost_id: undefined,
            likes: 0,
            liked: false,
            reply_count: 0,
            created_at: new Date().toISOString(),
            replies: [],
        };

        setThread(prev => {
            if (!prev) return prev;
            return { ...prev, replies: [...(prev.replies || []), optimisticReply] };
        });
        setReplyText('');

        requestAnimationFrame(() => {
            repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });

        const result = await createComment(postId, text);

        if (result) {
            setThread(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    replies: (prev.replies || []).map(r =>
                        r.id === tempId ? result : r
                    ),
                };
            });
        }
        // If result is null (timeout), keep the optimistic reply.
        // The broadcast event will eventually replace it.

        setSending(false);
    }, [replyText, sending, postId, username, currentUserAvatar, createComment]);

    const handleLike = useCallback(async (targetId: number) => {
        if (!thread || likingId === targetId) return;

        let isLiked = false;
        let currentLikes = 0;

        if (targetId === thread.id) {
            isLiked = thread.liked;
            currentLikes = thread.likes;
        } else {
            const reply = (thread.replies || []).find(r => r.id === targetId);
            if (!reply) return;
            isLiked = reply.liked;
            currentLikes = reply.likes;
        }

        const delta = isLiked ? -1 : 1;

        // Optimistic update
        setThread(prev => {
            if (!prev) return prev;
            if (prev.id === targetId) {
                return { ...prev, likes: Math.max(0, currentLikes + delta), liked: !isLiked };
            }
            return {
                ...prev,
                replies: (prev.replies || []).map(r =>
                    r.id === targetId ? { ...r, likes: Math.max(0, currentLikes + delta), liked: !isLiked } : r
                )
            };
        });

        setLikingId(targetId);

        try {
            const result = isLiked ? await unlikePost(targetId) : await likePost(targetId);
            if (result) {
                setThread(prev => {
                    if (!prev) return prev;
                    if (prev.id === targetId) {
                        return { ...prev, likes: result.likes };
                    }
                    return {
                        ...prev,
                        replies: (prev.replies || []).map(r => r.id === targetId ? { ...r, likes: result.likes } : r)
                    };
                });
            } else {
                // Revert
                setThread(prev => {
                    if (!prev) return prev;
                    if (prev.id === targetId) {
                        return { ...prev, likes: Math.max(0, currentLikes), liked: isLiked };
                    }
                    return {
                        ...prev,
                        replies: (prev.replies || []).map(r =>
                            r.id === targetId ? { ...r, likes: Math.max(0, currentLikes), liked: isLiked } : r
                        )
                    };
                });
            }
        } catch {
            // Revert
            setThread(prev => {
                if (!prev) return prev;
                if (prev.id === targetId) {
                    return { ...prev, likes: Math.max(0, currentLikes), liked: isLiked };
                }
                return {
                    ...prev,
                    replies: (prev.replies || []).map(r =>
                        r.id === targetId ? { ...r, likes: Math.max(0, currentLikes), liked: isLiked } : r
                    )
                };
            });
        } finally {
            setLikingId(null);
        }
    }, [thread, likingId, likePost, unlikePost]);

    if (loading) {
        return (
            <div className={`${s.viewTransition} ${entering ? s.viewEntering : ''}`}>
                <button className={s.backBtn} onClick={onBack}>
                    <img src="/icons-95/directory_open.ico" alt="" className={s.toolbarIco} />
                    Voltar
                </button>
                <SkeletonPost />
                <div style={{ padding: '8px 14px 8px 52px' }}>
                    <SkeletonPost />
                    <SkeletonPost />
                </div>
            </div>
        );
    }

    if (!thread) {
        return (
            <div className={`${s.viewTransition} ${entering ? s.viewEntering : ''}`}>
                <button className={s.backBtn} onClick={onBack}>
                    <img src="/icons-95/directory_open.ico" alt="" className={s.toolbarIco} />
                    Voltar
                </button>
                <div className={s.emptyState}>
                    <div className={s.emptyIcon}>
                        <img src="/icons-95/msg_warning.ico" alt="" className={s.emptyIco} />
                    </div>
                    <span className={s.emptyTitle}>Post nao encontrado</span>
                </div>
            </div>
        );
    }

    // const liked = likedSet.has(thread.id); // removed

    return (
        <div className={`${s.viewTransition} ${entering ? s.viewEntering : ''}`}>
            <button className={s.backBtn} onClick={onBack}>
                <img src="/icons-95/directory_open.ico" alt="" className={s.toolbarIco} />
                Voltar ao Feed
            </button>

            <div className={s.threadPost}>
                <div className={s.postHeader}>
                    <div className={s.postAvatar} onClick={() => onOpenProfile(thread.author)}>
                        {thread.avatar_url ? (
                            <img src={thread.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            avatarLetter(thread.author)
                        )}
                    </div>
                    <div className={s.postMeta}>
                        <span className={s.postAuthor} onClick={() => onOpenProfile(thread.author)}>
                            {thread.author}
                        </span>
                        <span className={s.postDate}>
                            {new Date(thread.created_at).toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
                <div className={s.threadBody}>{thread.texto}</div>
                <div className={s.postActions}>
                    <LikeButton
                        liked={thread.liked}
                        count={thread.likes || 0}
                        disabled={likingId === thread.id}
                        onClick={() => handleLike(thread.id)}
                    />
                    <span className={s.actionBtn}>
                        <img src="/icons-95/message_envelope_open.ico" alt="" className={s.actionIco} />
                        <span>{thread.reply_count ?? thread.replies?.length ?? 0} respostas</span>
                    </span>
                </div>
            </div>

            <div className={s.repliesSection}>
                <div className={s.repliesHeader}>
                    <img src="/icons-95/message_empty_tack.ico" alt="" className={s.repliesHeaderIco} />
                    Respostas
                </div>
                {thread.replies && thread.replies.length > 0 ? (
                    thread.replies.map((r, idx) => {
                        const isOptimistic = r.id < 0;
                        return (
                            <div
                                key={r.id}
                                className={`${s.replyItem} ${isOptimistic ? s.replyOptimistic : ''}`}
                                style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
                            >
                                <div className={s.postHeader}>
                                    <div
                                        className={s.replyAvatar}
                                        onClick={() => onOpenProfile(r.author)}
                                    >
                                        {r.avatar_url ? (
                                            <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            avatarLetter(r.author)
                                        )}
                                    </div>
                                    <div className={s.postMeta}>
                                        <span className={s.postAuthor} onClick={() => onOpenProfile(r.author)}>
                                            {r.author}
                                        </span>
                                        <span className={s.postDate}>
                                            {isOptimistic ? 'enviando...' : timeAgo(r.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className={s.replyBody}>{r.texto}</div>
                                <div className={s.postActions}>
                                    <LikeButton
                                        liked={r.liked}
                                        count={r.likes || 0}
                                        disabled={isOptimistic || likingId === r.id}
                                        onClick={() => handleLike(r.id)}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={s.emptyState}>
                        <span>ALGUÉM POR FAVOR COMENTE ALGUMA COISA!</span>
                    </div>
                )}
                <div ref={repliesEndRef} />
            </div>

            <div className={s.replyCompose}>
                <div className={s.replyAvatar}>
                    {currentUserAvatar ? (
                        <img src={currentUserAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        avatarLetter(username)
                    )}
                </div>
                <textarea
                    className={s.replyInput}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Escreva uma resposta..."
                    rows={2}
                    disabled={sending}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                    }}
                />
                <button className={s.composeBtn} onClick={handleReply} disabled={sending || !replyText.trim()}>
                    {sending ? '...' : 'Enviar'}
                </button>
            </div>
        </div>
    );
}
