'use client';

import React from 'react';
import s from '../Forum.module.css';

export function SkeletonPost() {
    return (
        <div className={s.skeletonPost}>
            <div className={s.skeletonRow}>
                <div className={s.skeletonAvatar} />
                <div className={s.skeletonLineShort} />
            </div>
            <div style={{ marginLeft: 42, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={s.skeletonLineLong} />
                <div className={s.skeletonLineMed} />
            </div>
            <div className={s.skeletonActions}>
                <div className={s.skeletonActionPill} />
                <div className={s.skeletonActionPill} />
            </div>
        </div>
    );
}

export function FeedSkeleton() {
    return (
        <>
            <SkeletonPost />
            <SkeletonPost />
            <SkeletonPost />
        </>
    );
}

export function FullLoading({ text }: { text: string }) {
    return (
        <div className={s.loadingFull}>
            <img src="/icons-95/application_hourglass.ico" alt="" style={{ width: 32, height: 32 }} />
            <div className={s.loadingText}>{text}</div>
            <div className={s.progressBar}>
                <div className={s.progressFill}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className={s.progressBlock} />
                    ))}
                </div>
            </div>
        </div>
    );
}
