'use client';

import React, { useState, useEffect } from 'react';
import type { Post, UserProfile } from './types';
import { fetchProfile } from './api';
import { avatarLetter } from './helpers';
import PostRow from './PostRow';
import { FeedSkeleton } from './Skeletons';
import s from '../Forum.module.css';

export default function ProfileView({
    username,
    onBack,
    onOpenThread,
    likedSet,
    onLike,
    onOpenProfile,
}: {
    username: string;
    onBack: () => void;
    onOpenThread: (id: number) => void;
    likedSet: Set<number>;
    onLike: (id: number) => void;
    onOpenProfile: (username: string) => void;
}) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'posts' | 'likes'>('posts');

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const data = await fetchProfile(username);
            if (!cancelled) {
                setProfile(data);
                setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [username]);

    if (loading) {
        return (
            <>
                <button className={s.threadBack} onClick={onBack}>Voltar</button>
                <FeedSkeleton />
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <button className={s.threadBack} onClick={onBack}>Voltar</button>
                <div className={s.emptyState}>
                    <img src="/icons-95/msg_error.ico" alt="" />
                    Usuario nao encontrado
                </div>
            </>
        );
    }

    const displayPosts = profile.posts || [];

    return (
        <div className={s.profileWrap}>
            <button className={s.threadBack} onClick={onBack}>Voltar</button>

            <div className={s.profileHeader}>
                <div className={s.profileAvatar}>{avatarLetter(profile.username)}</div>
                <div className={s.profileInfo}>
                    <div className={s.profileName}>{profile.username}</div>
                    <div className={s.profileStats}>
                        <span><span className={s.profileStatVal}>{profile.total_posts}</span> posts</span>
                        <span><span className={s.profileStatVal}>{profile.total_likes}</span> curtidas</span>
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
                        <div className={s.emptyState} style={{ height: 'auto', padding: 24 }}>
                            Nenhum post ainda
                        </div>
                    ) : (
                        displayPosts.map((p: Post) => (
                            <PostRow
                                key={p.id}
                                post={p}
                                onOpenThread={onOpenThread}
                                onLike={onLike}
                                onOpenProfile={onOpenProfile}
                                likedSet={likedSet}
                            />
                        ))
                    )
                )}
                {tab === 'likes' && (
                    <div className={s.emptyState} style={{ height: 'auto', padding: 24 }}>
                        <span className={s.profileStatVal}>{profile.total_likes}</span> curtidas recebidas no total
                    </div>
                )}
            </div>
        </div>
    );
}
