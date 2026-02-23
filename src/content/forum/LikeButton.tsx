'use client';

import { memo } from 'react';
import s from '../Forum.module.css';

interface LikeButtonProps {
    liked: boolean;
    count: number;
    disabled?: boolean;
    onClick: () => void;
    title?: string;
}

/**
 * Shared like button.
 * The pop animation is driven purely by CSS:
 * .actionIcoLiked has `animation: heartPopAnim` so it fires automatically
 * whenever React swaps the icon class (not-liked → liked).
 */
const LikeButton = memo(function LikeButton({
    liked,
    count,
    disabled = false,
    onClick,
    title,
}: LikeButtonProps) {
    return (
        <button
            className={`${s.actionBtn} ${liked ? s.actionBtnLiked : ''}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            disabled={disabled}
            title={title ?? (liked ? 'Descurtir' : 'Curtir')}
        >
            <img
                src="/icons-95/world_star.ico"
                alt=""
                className={liked ? s.actionIcoLiked : s.actionIco}
            />
            <span>{count}</span>
        </button>
    );
});

export default LikeButton;
