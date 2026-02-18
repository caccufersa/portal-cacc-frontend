'use client';

import React, { memo, useCallback, useRef } from 'react';
import type { Post } from './types';
import { timeAgo, avatarLetter } from './helpers';
import s from '../Forum.module.css';

interface PostRowProps {
    post: Post;
    onOpenThread: (id: number) => void;
    onLike: (id: number) => void;
    onOpenProfile: (username: string) => void;
    onDelete?: (id: number) => void;
    liked: boolean;
    isNew?: boolean;
    isOwner?: boolean;
}

const PostRow = memo(function PostRow({
    post,
    onOpenThread,
    onLike,
    onOpenProfile,
    onDelete,
    liked,
    isNew,
    isOwner,
}: PostRowProps) {
    const heartRef = useRef<HTMLButtonElement>(null);
    const isOptimistic = post.id < 0;

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOptimistic) return;
        heartRef.current?.classList.remove(s.heartPop);
        void heartRef.current?.offsetWidth;
        heartRef.current?.classList.add(s.heartPop);
        onLike(post.id);
    }, [onLike, post.id, isOptimistic]);

    const handleProfile = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenProfile(post.author);
    }, [onOpenProfile, post.author]);

    const handleThread = useCallback(() => {
        if (!isOptimistic) onOpenThread(post.id);
    }, [onOpenThread, post.id, isOptimistic]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(post.id);
    }, [onDelete, post.id]);

    return (
        <div
            className={`${s.post} ${isNew ? s.postEnter : ''} ${isOptimistic ? s.postOptimistic : ''}`}
            onClick={handleThread}
        >
            <div className={s.postHeader}>
                <div className={s.postAvatar} onClick={handleProfile}>
                    {avatarLetter(post.author)}
                </div>
                <div className={s.postMeta}>
                    <span className={s.postAuthor} onClick={handleProfile}>
                        {post.author}
                    </span>
                    <span className={s.postDate}>
                        {isOptimistic ? 'enviando...' : timeAgo(post.created_at)}
                    </span>
                </div>
                {isOwner && !isOptimistic && (
                    <button className={s.deleteBtn} onClick={handleDelete} title="Deletar post">
                        <img src="/icons-95/erase_file.ico" alt="deletar" className={s.deleteBtnIco} />
                    </button>
                )}
            </div>
            <div className={s.postBody}>{post.texto}</div>
            <div className={s.postActions}>
                <button
                    ref={heartRef}
                    className={`${s.actionBtn} ${liked ? s.actionBtnLiked : ''}`}
                    onClick={handleLike}
                    disabled={isOptimistic}
                    title={liked ? 'Remover curtida' : 'Curtir'}
                >
                    <img
                        src="/icons-95/world_star.ico"
                        alt=""
                        className={liked ? s.actionIcoLiked : s.actionIco}
                    />
                    <span>{post.likes || 0}</span>
                </button>
                <button
                    className={s.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleThread(); }}
                    disabled={isOptimistic}
                    title="Ver respostas"
                >
                    <img src="/icons-95/message_empty_tack.ico" alt="" className={s.actionIco} />
                    <span>{post.reply_count ?? post.replies?.length ?? 0}</span>
                </button>
            </div>
        </div>
    );
});

export default PostRow;
