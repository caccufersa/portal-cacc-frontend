'use client';

import { memo, useCallback } from 'react';
import type { Post } from './types';
import { timeAgo, avatarLetter } from './helpers';
import LikeButton from './LikeButton';
import s from '../Forum.module.css';

interface PostRowProps {
    post: Post;
    onOpenThread: (id: number) => void;
    onLike: (id: number) => void;
    onOpenProfile: (username: string) => void;
    onRepost?: (id: number) => void;
    onDelete?: (id: number) => void;
    liked: boolean;
    isNew?: boolean;
    isOwner?: boolean;
    isOptimistic?: boolean;
}


const PostRow = memo(function PostRow({
    post,
    onOpenThread,
    onLike,
    onOpenProfile,
    onRepost,
    onDelete,
    liked,
    isNew,
    isOwner,
}: PostRowProps) {
    const isOptimistic = post.id < 0;

    const handleLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOptimistic) return;
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

    const handleRepost = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOptimistic) return;
        onRepost?.(post.id);
    }, [onRepost, post.id, isOptimistic]);

    const isRepost = !!post.repost_id;

    return (
        <div
            className={`${s.post} ${isNew ? s.postEnter : ''} ${isOptimistic ? s.postOptimistic : ''}`}
            onClick={handleThread}
        >
            {isRepost && (
                <div style={{ fontSize: 11, color: '#808080', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <img src="/icons-95/directory_open_refresh.ico" alt="" style={{ width: 12, height: 12, imageRendering: 'pixelated' }} />
                    <span>repostou</span>
                </div>
            )}
            <div className={s.postHeader}>
                <div className={s.postAvatar} onClick={handleProfile}>
                    {post.avatar_url ? (
                        <img src={post.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        avatarLetter(post.author)
                    )}
                </div>
                <div className={s.postMeta}>
                    <span className={s.postAuthor} onClick={handleProfile}>
                        {post.author_name || post.author} <span style={{ opacity: 0.6, fontSize: '0.9em' }}>@{post.author}</span>
                    </span>
                    <span className={s.postDate}>
                        {isOptimistic ? 'enviando...' : timeAgo(post.created_at)}
                    </span>
                </div>
                {isOwner && !isOptimistic && (
                    <button className={s.deleteBtn} onClick={handleDelete} title="Deletar post">
                        <img src="/icons-95/recycle_bin_empty.ico" alt="deletar" className={s.deleteBtnIco} />
                    </button>
                )}
            </div>
            <div className={s.postBody}>{post.texto}</div>
            <div className={s.postActions}>
                <LikeButton
                    liked={liked}
                    count={post.likes || 0}
                    disabled={isOptimistic}
                    onClick={() => onLike(post.id)}
                />
                <button
                    className={s.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleThread(); }}
                    disabled={isOptimistic}
                    title="Responder"
                >
                    <img src="/icons-95/message_envelope_open.ico" alt="" className={s.actionIco} />
                    <span>{post.reply_count ?? post.replies?.length ?? 0}</span>
                </button>
                {!isRepost && onRepost && (
                    <button
                        className={s.actionBtn}
                        onClick={handleRepost}
                        disabled={isOptimistic}
                        title="Repostar"
                    >
                        <img src="/icons-95/directory_open_refresh.ico" alt="" className={s.actionIco} />
                        <span>Repost</span>
                    </button>
                )}
            </div>
        </div>
    );
});

export default PostRow;
