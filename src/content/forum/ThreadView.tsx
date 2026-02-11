'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Post } from './types';
import { MAX_CHARS } from './types';
import { fetchThread as apiFetchThread, createComment } from './api';
import { invalidate } from './cache';
import { timeAgo, avatarLetter } from './helpers';
import { SkeletonPost } from './Skeletons';
import s from '../Forum.module.css';

export default function ThreadView({
    postId,
    onBack,
    token,
    username,
    likedSet,
    toggleLike,
    onOpenProfile,
}: {
    postId: number;
    onBack: () => void;
    token: string;
    username: string;
    likedSet: Set<number>;
    toggleLike: (id: number) => void;
    onOpenProfile: (username: string) => void;
}) {
    const [thread, setThread] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    const reload = useCallback(() => {
        invalidate(`thread:${postId}`);
        apiFetchThread(postId).then(data => {
            if (data) setThread(data);
            setLoading(false);
        });
    }, [postId]);

    useEffect(() => {
        let active = true;
        apiFetchThread(postId).then(data => {
            if (!active) return;
            if (data) setThread(data);
            setLoading(false);
        });
        return () => { active = false; };
    }, [postId]);

    const handleReply = async () => {
        if (!replyText.trim() || sending) return;
        setSending(true);
        const ok = await createComment(postId, replyText.trim(), username, token);
        if (ok) {
            setReplyText('');
            reload();
        }
        setSending(false);
    };

    if (loading) {
        return (
            <>
                <button className={s.threadBack} onClick={onBack}>Voltar</button>
                <SkeletonPost />
                <div style={{ padding: '8px 14px 8px 52px' }}>
                    <SkeletonPost />
                    <SkeletonPost />
                </div>
            </>
        );
    }

    if (!thread) {
        return (
            <>
                <button className={s.threadBack} onClick={onBack}>Voltar</button>
                <div className={s.emptyState}>
                    <img src="/icons-95/msg_error.ico" alt="" />
                    Post nao encontrado
                </div>
            </>
        );
    }

    const liked = likedSet.has(thread.id);

    return (
        <>
            <button className={s.threadBack} onClick={onBack}>Voltar ao Feed</button>

            <div className={s.threadPost}>
                <div className={s.postHeader}>
                    <div className={s.postAvatar}>{avatarLetter(thread.author)}</div>
                    <span className={s.postAuthor} onClick={() => onOpenProfile(thread.author)}>
                        {thread.author}
                    </span>
                    <span className={s.postDate}>{new Date(thread.data_criacao).toLocaleString('pt-BR')}</span>
                </div>
                <div className={s.postBody} style={{ marginLeft: 0, fontSize: 17 }}>{thread.texto}</div>
                <div className={s.postActions} style={{ marginLeft: 0 }}>
                    <button
                        className={`${s.postActionBtn} ${liked ? s.postActionBtnLiked : ''}`}
                        onClick={() => toggleLike(thread.id)}
                    >
                        {liked ? '\u2665' : '\u2661'} {thread.likes || 0}
                    </button>
                    <span className={s.postActionBtn}>{thread.replies?.length ?? 0} respostas</span>
                </div>
            </div>

            <div className={s.threadReplies}>
                {thread.replies && thread.replies.length > 0 ? (
                    thread.replies.map(r => (
                        <div key={r.id} className={s.replyItem}>
                            <div className={s.postHeader}>
                                <div className={s.postAvatar} style={{ width: 24, height: 24, fontSize: 12 }}>
                                    {avatarLetter(r.author)}
                                </div>
                                <span className={s.postAuthor} style={{ fontSize: 14 }} onClick={() => onOpenProfile(r.author)}>
                                    {r.author}
                                </span>
                                <span className={s.postDate}>{timeAgo(r.data_criacao)}</span>
                            </div>
                            <div className={s.postBody} style={{ marginLeft: 30, fontSize: 15 }}>{r.texto}</div>
                            <div className={s.postActions} style={{ marginLeft: 30 }}>
                                <button
                                    className={`${s.postActionBtn} ${likedSet.has(r.id) ? s.postActionBtnLiked : ''}`}
                                    onClick={() => toggleLike(r.id)}
                                >
                                    {likedSet.has(r.id) ? '\u2665' : '\u2661'} {r.likes || 0}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={s.emptyState} style={{ height: 'auto', padding: 24 }}>
                        Nenhuma resposta ainda. Seja o primeiro!
                    </div>
                )}
            </div>

            <div className={s.replyCompose}>
                <textarea
                    className={s.replyInput}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Escreva uma resposta..."
                    rows={2}
                    disabled={sending}
                />
                <button className={s.toolbarBtn} onClick={handleReply} disabled={sending || !replyText.trim()}>
                    {sending ? 'Enviando...' : 'Enviar'}
                </button>
            </div>
        </>
    );
}
