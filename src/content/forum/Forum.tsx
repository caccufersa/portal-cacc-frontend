'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Post, View } from './types';
import { MAX_CHARS } from './types';
import { fetchPosts, createPost, toggleLikeApi, patchPostLikes } from './api';
import { invalidate, setCache } from './cache';
import { useForumSocket } from './useForumSocket';
import AuthScreen from './AuthScreen';
import PostRow from './PostRow';
import ThreadView from './ThreadView';
import ProfileView from './ProfileView';
import { FeedSkeleton, FullLoading } from './Skeletons';
import s from '../Forum.module.css';

const POLL_INTERVAL = 30_000;

const Forum: React.FC = () => {
    const { user, isLoading: authLoading, logout } = useAuth();

    const [posts, setPosts] = useState<Post[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [composeText, setComposeText] = useState('');
    const [posting, setPosting] = useState(false);
    const [view, setView] = useState<View>({ type: 'feed' });
    const [likedSet, setLikedSet] = useState<Set<number>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = localStorage.getItem('cacc-forum-likes');
            if (stored) return new Set(JSON.parse(stored));
        } catch { /* ignore */ }
        return new Set();
    });
    const likingRef = useRef<Set<number>>(new Set());
    const feedRef = useRef<HTMLDivElement>(null);

    const persistLikes = (set: Set<number>) => {
        localStorage.setItem('cacc-forum-likes', JSON.stringify([...set]));
    };

    const loadFeed = useCallback(async () => {
        const data = await fetchPosts();
        setPosts(data);
        setFeedLoading(false);
    }, []);

    const onWsNewPost = useCallback((post: Post) => {
        setPosts(prev => {
            if (prev.some(p => p.id === post.id)) return prev;
            const next = [post, ...prev];
            setCache('feed', next);
            return next;
        });
    }, []);

    const onWsLikeUpdate = useCallback((postId: number, likes: number) => {
        setPosts(prev => {
            const next = prev.map(p => p.id === postId ? { ...p, likes } : p);
            setCache('feed', next);
            return next;
        });
    }, []);

    const onWsNewComment = useCallback((parentId: number, comment: Post) => {
        setPosts(prev => {
            const next = prev.map(p => {
                if (p.id !== parentId) return p;
                const replies = p.replies || [];
                if (replies.some(r => r.id === comment.id)) return p;
                return { ...p, replies: [...replies, comment] };
            });
            setCache('feed', next);
            return next;
        });
        invalidate(`thread:${parentId}`);
    }, []);

    const wsConnected = useForumSocket(
        !!user,
        onWsNewPost,
        onWsLikeUpdate,
        onWsNewComment,
    );

    useEffect(() => {
        if (!user) return;
        let active = true;
        const run = async () => {
            const data = await fetchPosts();
            if (active) { setPosts(data); setFeedLoading(false); }
        };
        run();
        const interval = wsConnected ? 60_000 : POLL_INTERVAL;
        const iv = setInterval(() => {
            fetchPosts().then(d => { if (active) setPosts(d); });
        }, interval);
        return () => { active = false; clearInterval(iv); };
    }, [user, wsConnected]);

    const handlePost = async () => {
        if (!composeText.trim() || posting || !user) return;
        setPosting(true);
        const newPost = await createPost(composeText.trim(), user.username, user.token);
        if (newPost) {
            setPosts(prev => [newPost, ...prev]);
            setComposeText('');
        }
        setPosting(false);
    };

    const toggleLike = useCallback(async (postId: number) => {
        if (!user) return;
        if (likingRef.current.has(postId)) return;
        likingRef.current.add(postId);

        const liked = likedSet.has(postId);
        const delta = liked ? -1 : 1;

        setLikedSet(prev => {
            const next = new Set(prev);
            if (liked) next.delete(postId); else next.add(postId);
            persistLikes(next);
            return next;
        });

        setPosts(prev =>
            prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes + delta) } : p),
        );
        patchPostLikes(postId, delta);

        const ok = await toggleLikeApi(postId, liked, user.token);
        if (!ok) {
            setLikedSet(prev => {
                const rb = new Set(prev);
                if (liked) rb.add(postId); else rb.delete(postId);
                persistLikes(rb);
                return rb;
            });
            setPosts(prev =>
                prev.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - delta) } : p),
            );
            patchPostLikes(postId, -delta);
        }

        likingRef.current.delete(postId);
    }, [user, likedSet]);

    const addressText = () => {
        if (view.type === 'thread') return `cacc://forum/thread/${view.id}`;
        if (view.type === 'profile') return `cacc://forum/user/${view.username}`;
        return 'cacc://forum/feed';
    };

    if (authLoading) return <FullLoading text="Verificando credenciais..." />;
    if (!user) return <AuthScreen />;

    return (
        <div className={s.container}>
            <div className={s.toolbar}>
                <button className={s.toolbarBtn} onClick={() => { invalidate('feed'); loadFeed(); }}>
                    Atualizar
                </button>
                <div className={s.toolbarSep} />
                <button
                    className={`${s.toolbarBtn} ${view.type === 'feed' ? s.toolbarBtnActive : ''}`}
                    onClick={() => setView({ type: 'feed' })}
                >
                    Feed
                </button>
                {view.type !== 'feed' && (
                    <button className={s.toolbarBtn} onClick={() => setView({ type: 'feed' })}>
                        Voltar
                    </button>
                )}
                <div className={s.toolbarSep} />
                <button
                    className={`${s.toolbarBtn} ${view.type === 'profile' && view.username === user.username ? s.toolbarBtnActive : ''}`}
                    onClick={() => setView({ type: 'profile', username: user.username })}
                >
                    Meu Perfil
                </button>
                <div className={s.toolbarUser}>
                    <img src="/icons-95/user_computer.ico" alt="" />
                    {user.username}
                    <div className={`${s.wsIndicator} ${wsConnected ? s.wsOn : s.wsOff}`} title={wsConnected ? 'Conectado em tempo real' : 'Modo polling'} />
                    <button className={s.toolbarBtn} onClick={logout} style={{ fontSize: 13, padding: '3px 8px' }}>
                        Sair
                    </button>
                </div>
            </div>

            <div className={s.addressBar}>
                <span className={s.addressLabel}>Endereco:</span>
                <div className={s.addressInput}>{addressText()}</div>
            </div>

            <div className={s.feed} ref={feedRef}>
                {view.type === 'profile' ? (
                    <ProfileView
                        username={view.username}
                        onBack={() => setView({ type: 'feed' })}
                        onOpenThread={id => setView({ type: 'thread', id })}
                        likedSet={likedSet}
                        onLike={toggleLike}
                        onOpenProfile={u => setView({ type: 'profile', username: u })}
                    />
                ) : view.type === 'thread' ? (
                    <ThreadView
                        postId={view.id}
                        onBack={() => setView({ type: 'feed' })}
                        token={user.token}
                        username={user.username}
                        likedSet={likedSet}
                        toggleLike={toggleLike}
                        onOpenProfile={u => setView({ type: 'profile', username: u })}
                    />
                ) : (
                    <>
                        <div className={s.composeBox}>
                            <div className={s.composeRow}>
                                <textarea
                                    className={s.composeTextarea}
                                    value={composeText}
                                    onChange={e => setComposeText(e.target.value.slice(0, MAX_CHARS))}
                                    placeholder="No que voce esta pensando?"
                                    disabled={posting}
                                />
                                <button
                                    className={s.composeBtn}
                                    onClick={handlePost}
                                    disabled={posting || !composeText.trim()}
                                >
                                    {posting ? 'Enviando...' : 'Postar'}
                                </button>
                            </div>
                            <div className={`${s.composeCharCount} ${composeText.length > MAX_CHARS - 20 ? s.composeCharCountWarn : ''}`}>
                                {composeText.length}/{MAX_CHARS}
                            </div>
                        </div>

                        {feedLoading ? (
                            <FeedSkeleton />
                        ) : posts.length === 0 ? (
                            <div className={s.emptyState}>
                                <img src="/icons-95/message_empty_tack.ico" alt="" />
                                <span>O mural esta vazio.</span>
                                <span>Seja o primeiro a postar!</span>
                            </div>
                        ) : (
                            posts.map(p => (
                                <PostRow
                                    key={p.id}
                                    post={p}
                                    onOpenThread={id => setView({ type: 'thread', id })}
                                    onLike={toggleLike}
                                    onOpenProfile={u => setView({ type: 'profile', username: u })}
                                    likedSet={likedSet}
                                />
                            ))
                        )}
                    </>
                )}
            </div>

            <div className={s.statusbar}>
                <div className={s.statusSection}>
                    {feedLoading ? 'Carregando...' : `${posts.length} posts`}
                </div>
                <div className={s.statusSection}>
                    {user.username}
                </div>
                <div className={s.statusSection} style={{ marginLeft: 'auto' }}>
                    {wsConnected ? 'Tempo real' : 'Polling'}
                </div>
                <div className={s.statusSection}>
                    {view.type === 'thread' ? `Thread #${view.id}` : view.type === 'profile' ? view.username : 'Feed'}
                </div>
            </div>
        </div>
    );
};

export default Forum;
