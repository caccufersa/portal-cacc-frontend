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
    isOptimistic?: boolean;
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
        // Animation is now handled by the state change from the parent which waits for server
        // But we can trigger a pop if we want immediate feedback, however User requested "Wait for confirmation"
        // So we should probably NOT animate until the prop 'liked' actually changes.
        // But 'liked' prop changes when parent updates state.

        // If we want the pop animation to happen ON confirmation:
        // We can add a useEffect to watch 'liked' prop? 
        // Or just keep the click animation but know the number won't change yet?
        // User asked for "same logic as ThreadView, server confirmation".
        // In ThreadView, we removed optimistic state updates.

        onLike(post.id);
    }, [onLike, post.id, isOptimistic]);

    // Effect to trigger animation when liked state changes to true
    React.useEffect(() => {
        if (liked) {
            heartRef.current?.classList.remove(s.heartPop);
            void heartRef.current?.offsetWidth;
            heartRef.current?.classList.add(s.heartPop);
        }
    }, [liked]);

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
                        <img src="/icons-95/recycle_bin_empty.ico" alt="deletar" className={s.deleteBtnIco} />
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
                    title={liked ? 'Descurtir' : 'Curtir'}
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
                    title="Responder"
                >
                    <img src="/icons-95/message_envelope_open.ico" alt="" className={s.actionIco} />
                    <span>{post.reply_count ?? post.replies?.length ?? 0}</span>
                </button>
            </div>
        </div>
    );
});

export default PostRow;
