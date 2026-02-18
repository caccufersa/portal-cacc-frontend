'use client';

import React, { useState, useEffect, memo } from 'react';
import type { Post, UserProfile } from './types';
import { fetchProfile } from './api';
import { avatarLetter } from './helpers';
import PostRow from './PostRow';
import { FeedSkeleton } from './Skeletons';
import s from '../Forum.module.css';

const ProfileView = memo(function ProfileView({
    username,
    onBack,
    onOpenThread,
    likedSet,
    onLike,
}: {
    username: string;
    onBack: () => void;
    onOpenThread: (id: number) => void;
    likedSet: Set<number>;
    onLike: (id: number) => void;
}) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'posts' | 'likes'>('posts');
    const [entering, setEntering] = useState(true);

    useEffect(() => {
        requestAnimationFrame(() => setEntering(false));
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetchProfile(username).then(data => {
            if (!cancelled) {
                setProfile(data);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [username]);

    if (loading) {
        return (
            <div className={`${s.viewTransition} ${entering ? s.viewEntering : ''}`}>
                <button className={s.backBtn} onClick={onBack}>← Voltar</button>
                <div className={s.profileHeader}>
                    <div className={`${s.profileAvatarLg} ${s.skeletonShimmer}`} />
                    <div className={s.profileInfo}>
                        <div className={`${s.skeletonLineShort} ${s.skeletonShimmer}`} style={{ height: 18, marginBottom: 8 }} />
                        <div className={`${s.skeletonLineMed} ${s.skeletonShimmer}`} style={{ height: 14 }} />
                    </div>
                </div>
                <FeedSkeleton />
            </div>
        );
    }

    if (!profile) {
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
                    <span className={s.emptyTitle}>Usuario nao encontrado</span>
                </div>
            </div>
        );
    }

    const displayPosts = profile.posts || [];

    return (
        <div className={`${s.profileWrap} ${s.viewTransition} ${entering ? s.viewEntering : ''}`}>
            <button className={s.backBtn} onClick={onBack}>
                <img src="/icons-95/directory_open.ico" alt="" className={s.toolbarIco} />
                Voltar
            </button>

            <div className={s.profileHeader}>
                <div className={s.profileAvatarLg}>{avatarLetter(profile.username)}</div>
                <div className={s.profileInfo}>
                    <div className={s.profileName}>{profile.username}</div>
                    <div className={s.profileStats}>
                        <div className={s.profileStat}>
                            <span className={s.profileStatVal}>{profile.total_posts}</span>
                            <span className={s.profileStatLabel}>posts</span>
                        </div>
                        <div className={s.profileStat}>
                            <span className={s.profileStatVal}>{profile.total_likes}</span>
                            <span className={s.profileStatLabel}>curtidas</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={s.profileTabs}>
                <button
                    className={`${s.profileTab} ${tab === 'posts' ? s.profileTabActive : ''}`}
                    onClick={() => setTab('posts')}
                >
                    Posts
                </button>
                <button
                    className={`${s.profileTab} ${tab === 'likes' ? s.profileTabActive : ''}`}
                    onClick={() => setTab('likes')}
                >
                    Curtidas
                </button>
            </div>

            <div className={s.profilePosts}>
                {tab === 'posts' && (
                    displayPosts.length === 0 ? (
                        <div className={s.emptyState} style={{ height: 'auto', padding: 32 }}>
                            <span className={s.emptySubtitle}>Nenhum post ainda</span>
                        </div>
                    ) : (
                        displayPosts.map((p: Post) => (
                            <PostRow
                                key={p.id}
                                post={p}
                                onOpenThread={onOpenThread}
                                onLike={onLike}
                                onOpenProfile={() => {}}
                                liked={likedSet.has(p.id)}
                            />
                        ))
                    )
                )}
                {tab === 'likes' && (
                    <div className={s.emptyState} style={{ height: 'auto', padding: 32 }}>
                        <span className={s.profileStatVal} style={{ fontSize: 28 }}>{profile.total_likes}</span>
                        <span className={s.emptySubtitle}>curtidas recebidas no total</span>
                    </div>
                )}
            </div>
        </div>
    );
});

export default ProfileView;
