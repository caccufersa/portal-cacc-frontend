'use client';

import React from 'react';
import type { Post } from './types';
import { timeAgo, avatarLetter } from './helpers';
import s from '../Forum.module.css';

export default function PostRow({
    post,
    onOpenThread,
    onLike,
    onOpenProfile,
    likedSet,
}: {
    post: Post;
    onOpenThread: (id: number) => void;
    onLike: (id: number) => void;
    onOpenProfile: (username: string) => void;
    likedSet: Set<number>;
}) {
    const liked = likedSet.has(post.id);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenThread(post.id);
        }
    };

    const handleAuthorKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onOpenProfile(post.author);
        }
    };

    return (
        <div
            className={s.post}
            onClick={() => onOpenThread(post.id)}
            onKeyDown={handleKeyPress}
            role="button"
            tabIndex={0}
            aria-label={`Post de ${post.author}: ${post.texto.substring(0, 50)}${post.texto.length > 50 ? '...' : ''}`}
        >
            <div className={s.postHeader}>
                <div className={s.postAvatar}>{avatarLetter(post.author)}</div>
                <span
                    className={s.postAuthor}
                    onClick={e => { e.stopPropagation(); onOpenProfile(post.author); }}
                    onKeyDown={handleAuthorKeyPress}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver perfil de ${post.author}`}
                >
                    {post.author}
                </span>
                <span className={s.postDate}>{timeAgo(post.data_criacao)}</span>
            </div>
            <div className={s.postBody}>{post.texto}</div>
            <div className={s.postActions}>
                <button
                    className={`${s.postActionBtn} ${liked ? s.postActionBtnLiked : ''}`}
                    onClick={e => { e.stopPropagation(); onLike(post.id); }}
                >
                    {liked ? '\u2665' : '\u2661'} {post.likes || 0}
                </button>
                <button
                    className={s.postActionBtn}
                    onClick={e => { e.stopPropagation(); onOpenThread(post.id); }}
                >
                    Respostas {post.replies?.length ?? 0}
                </button>
            </div>
        </div>
    );
}
