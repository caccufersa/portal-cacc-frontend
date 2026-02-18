'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Post } from './types';
import { MAX_CHARS } from './types';
import { fetchThread as apiFetchThread, createComment } from './api';
import { timeAgo, avatarLetter } from './helpers';
import { SkeletonPost } from './Skeletons';
import s from '../Forum.module.css';

let optimisticId = -1;

export default function ThreadView({
    postId,
    onBack,
    username,
    likedSet,
    toggleLike,
    onOpenProfile,
}: {
    postId: number;
    onBack: () => void;
    username: string;
    likedSet: Set<number>;
    toggleLike: (id: number) => void;
    onOpenProfile: (username: string) => void;
}) {
    const [thread, setThread] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const repliesEndRef = useRef<HTMLDivElement>(null);
    const [entering, setEntering] = useState(true);

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
    }, [postId]);

    const handleReply = useCallback(async () => {
        if (!replyText.trim() || sending) return;
        setSending(true);

        const text = replyText.trim();
        const tempId = optimisticId--;
        const optimisticReply: Post = {
            id: tempId,
            texto: text,
            author: username,
            user_id: 0,
            parent_id: postId,
            likes: 0,
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
    }, [replyText, sending, postId, username]);

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

    const liked = likedSet.has(thread.id);

    return (
        <div className={`${s.viewTransition} ${entering ? s.viewEntering : ''}`}>
            <button className={s.backBtn} onClick={onBack}>
                <img src="/icons-95/directory_open.ico" alt="" className={s.toolbarIco} />
                Voltar ao Feed
            </button>

            <div className={s.threadPost}>
                <div className={s.postHeader}>
                    <div className={s.postAvatar} onClick={() => onOpenProfile(thread.author)}>
                        {avatarLetter(thread.author)}
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
                    <button
                        className={`${s.actionBtn} ${liked ? s.actionBtnLiked : ''}`}
                        onClick={() => toggleLike(thread.id)}
                        title={liked ? 'Remover curtida' : 'Curtir'}
                    >
                        <img
                            src="/icons-95/world_star.ico"
                            alt=""
                            className={liked ? s.actionIcoLiked : s.actionIco}
                        />
                        <span>{thread.likes || 0}</span>
                    </button>
                    <span className={s.actionBtn}>
                        <img src="/icons-95/message_empty_tack.ico" alt="" className={s.actionIco} />
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
                                        {avatarLetter(r.author)}
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
                                    <button
                                        className={`${s.actionBtn} ${likedSet.has(r.id) ? s.actionBtnLiked : ''}`}
                                        onClick={() => toggleLike(r.id)}
                                        disabled={isOptimistic}
                                        title={likedSet.has(r.id) ? 'Remover curtida' : 'Curtir'}
                                    >
                                        <img
                                            src="/icons-95/world_star.ico"
                                            alt=""
                                            className={likedSet.has(r.id) ? s.actionIcoLiked : s.actionIco}
                                        />
                                        <span>{r.likes || 0}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={s.emptyState} style={{ height: 'auto', padding: 24 }}>
                        <span className={s.emptySubtitle}>Nenhuma resposta ainda. Seja o primeiro!</span>
                    </div>
                )}
                <div ref={repliesEndRef} />
            </div>

            <div className={s.replyCompose}>
                <div className={s.replyAvatar}>{avatarLetter(username)}</div>
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
