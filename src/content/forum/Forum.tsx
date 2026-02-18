'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Post, View } from './types';
import { MAX_CHARS } from './types';
import { fetchPosts, createPost, likePost, unlikePost, deletePost, patchPostLikes } from './api';
import { invalidate, setCache } from './cache';
import { useForumSocket } from './useForumSocket';
import PostRow from './PostRow';
import ThreadView from './ThreadView';
import ProfileView from './ProfileView';
import { FeedSkeleton, FullLoading } from './Skeletons';
import s from '../Forum.module.css';

let optimisticPostId = -1000;

const Forum: React.FC = () => {
    const { user, isLoading: authLoading, logout } = useAuth();

    const [posts, setPosts] = useState<Post[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [composeText, setComposeText] = useState('');
    const [posting, setPosting] = useState(false);
    const [view, setView] = useState<View>({ type: 'feed' });
    const [newPostIds, setNewPostIds] = useState<Set<number>>(new Set());
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

    const persistLikes = useCallback((set: Set<number>) => {
        localStorage.setItem('cacc-forum-likes', JSON.stringify([...set]));
    }, []);

    const onWsNewPost = useCallback((post: Post) => {
        setPosts(prev => {
            if (prev.some(p => p.id === post.id)) return prev;
            const withoutOptimistic = prev.filter(p => {
                if (p.id >= 0) return true;
                return !(p.texto === post.texto && p.author === post.author);
            });
            const next = [post, ...withoutOptimistic];
            setCache('feed:30:0', next);
            return next;
        });
        setNewPostIds(prev => new Set(prev).add(post.id));
        setTimeout(() => {
            setNewPostIds(prev => {
                const next = new Set(prev);
                next.delete(post.id);
                return next;
            });
        }, 600);
    }, []);

    const onWsLikeUpdate = useCallback((postId: number, likes: number) => {
        setPosts(prev => {
            const next = prev.map(p => p.id === postId ? { ...p, likes } : p);
            setCache('feed:30:0', next);
            return next;
        });
    }, []);

    const onWsNewComment = useCallback((parentId: number, comment: Post) => {
        setPosts(prev => {
            const next = prev.map(p => {
                if (p.id !== parentId) return p;
                const replies = p.replies || [];
                if (replies.some(r => r.id === comment.id)) return p;
                return { ...p, replies: [...replies, comment], reply_count: p.reply_count + 1 };
            });
            setCache('feed:30:0', next);
            return next;
        });
        invalidate(`thread:${parentId}`);
    }, []);

    const onWsPostDeleted = useCallback((postId: number) => {
        setPosts(prev => {
            const next = prev.filter(p => p.id !== postId);
            setCache('feed:30:0', next);
            return next;
        });
        invalidate(`thread:${postId}`);
        if (view.type === 'thread' && view.id === postId) {
            setView({ type: 'feed' });
        }
    }, [view]);

    const { connected: wsConnected } = useForumSocket({
        onNewPost: onWsNewPost,
        onLikeUpdate: onWsLikeUpdate,
        onNewComment: onWsNewComment,
        onPostDeleted: onWsPostDeleted,
    });

    useEffect(() => {
        if (!user) return;
        let active = true;

        const run = async () => {
            const data = await fetchPosts();
            if (!active) return;
            if (data.length > 0 || wsConnected) setFeedLoading(false);
            setPosts(data);
        };

        if (wsConnected) run();

        const interval = wsConnected ? 120_000 : 5_000;
        const iv = setInterval(() => { if (active) run(); }, interval);

        return () => { active = false; clearInterval(iv); };
    }, [user, wsConnected]);

    const handlePost = useCallback(async () => {
        if (!composeText.trim() || posting || !user) return;
        setPosting(true);

        const text = composeText.trim();
        const tempId = optimisticPostId--;

        const optimisticPost: Post = {
            id: tempId,
            texto: text,
            author: user.username,
            user_id: 0,
            parent_id: null,
            likes: 0,
            reply_count: 0,
            created_at: new Date().toISOString(),
            replies: [],
        };

        setPosts(prev => [optimisticPost, ...prev]);
        setComposeText('');
        setNewPostIds(prev => new Set(prev).add(tempId));

        const realPost = await createPost(text);

        if (realPost) {
            setPosts(prev => prev.map(p => p.id === tempId ? realPost : p));
            setNewPostIds(prev => {
                const next = new Set(prev);
                next.delete(tempId);
                next.add(realPost.id);
                return next;
            });
            setTimeout(() => {
                setNewPostIds(prev => {
                    const next = new Set(prev);
                    next.delete(realPost.id);
                    return next;
                });
            }, 600);
        } else {
            setTimeout(() => {
                setPosts(prev => {
                    if (prev.some(p => p.id === tempId)) {
                        return prev.filter(p => p.id !== tempId);
                    }
                    return prev;
                });
            }, 15_000);
        }

        setPosting(false);
    }, [composeText, posting, user]);

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

        const result = liked ? await unlikePost(postId) : await likePost(postId);
        if (!result) {
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
    }, [user, likedSet, persistLikes]);

    const handleDelete = useCallback(async (postId: number) => {
        const result = await deletePost(postId);
        if (result) {
            setPosts(prev => prev.filter(p => p.id !== postId));
        }
    }, []);

    const navigateFeed = useCallback(() => setView({ type: 'feed' }), []);
    const navigateThread = useCallback((id: number) => setView({ type: 'thread', id }), []);
    const navigateProfile = useCallback((username: string) => setView({ type: 'profile', username }), []);

    const addressText = useMemo(() => {
        if (view.type === 'thread') return `cacc://social/thread/${view.id}`;
        if (view.type === 'profile') return `cacc://social/user/${view.username}`;
        return 'cacc://social/feed';
    }, [view]);

    const refreshFeed = useCallback(() => {
        invalidate('feed:*');
        setFeedLoading(true);
        fetchPosts().then(data => {
            setPosts(data);
            setFeedLoading(false);
        });
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    if (authLoading) return <FullLoading text="Verificando credenciais..." />;
    if (!user) return (
        <div className={s.container}>
            <div className={s.emptyState}>
                <div className={s.emptyIcon}>
                    <img src="/icons-95/key_padlock.ico" alt="" className={s.emptyIco} />
                </div>
                <span className={s.emptyTitle}>Faca login para acessar</span>
                <span className={s.emptySubtitle}>Clique no icone de perfil na barra de tarefas para entrar.</span>
            </div>
        </div>
    );

    return (
        <div className={s.container}>
            {/* Toolbar */}
            <div className={s.toolbar}>
                <button className={s.toolbarBtn} onClick={refreshFeed} title="Atualizar feed">
                    <img src="/icons-95/overlay_refresh.ico" alt="" className={s.toolbarIco} />
                    Atualizar
                </button>
                <div className={s.toolbarSep} />
                <button
                    className={`${s.toolbarBtn} ${view.type === 'feed' ? s.toolbarBtnActive : ''}`}
                    onClick={navigateFeed}
                >
                    <img src="/icons-95/newspaper.ico" alt="" className={s.toolbarIco} />
                    Feed
                </button>
                {view.type !== 'feed' && (
                    <button className={s.toolbarBtn} onClick={navigateFeed}>
                        <img src="/icons-95/directory_open.ico" alt="" className={s.toolbarIco} />
                        Voltar
                    </button>
                )}
                <div className={s.toolbarSep} />
                <button
                    className={`${s.toolbarBtn} ${view.type === 'profile' && view.username === user.username ? s.toolbarBtnActive : ''}`}
                    onClick={() => navigateProfile(user.username)}
                >
                    <img src="/icons-95/user_card.ico" alt="" className={s.toolbarIco} />
                    Meu Perfil
                </button>
                <div className={s.toolbarUser}>
                    <div className={s.toolbarUserAvatar}>{user.username[0].toUpperCase()}</div>
                    <span>{user.username}</span>
                    <div className={`${s.wsIndicator} ${wsConnected ? s.wsOn : s.wsOff}`} title={wsConnected ? 'Conectado' : 'Reconectando...'} />
                    <button className={s.toolbarBtnSmall} onClick={logout}>
                        Sair
                    </button>
                </div>
            </div>

            {/* Address bar */}
            <div className={s.addressBar}>
                <span className={s.addressLabel}>Endereco:</span>
                <div className={s.addressInput}>{addressText}</div>
            </div>

            {/* Content */}
            <div className={s.feed} ref={feedRef}>
                {view.type === 'profile' ? (
                    <ProfileView
                        username={view.username}
                        onBack={navigateFeed}
                        onOpenThread={navigateThread}
                        likedSet={likedSet}
                        onLike={toggleLike}
                    />
                ) : view.type === 'thread' ? (
                    <ThreadView
                        postId={view.id}
                        onBack={navigateFeed}
                        username={user.username}
                        likedSet={likedSet}
                        toggleLike={toggleLike}
                        onOpenProfile={navigateProfile}
                    />
                ) : (
                    <>
                        {/* Compose */}
                        <div className={s.composeBox}>
                            <div className={s.composeHeader}>
                                <div className={s.composeAvatar}>{user.username[0].toUpperCase()}</div>
                                <span className={s.composeLabel}>No que voce esta pensando?</span>
                            </div>
                            <textarea
                                className={s.composeTextarea}
                                value={composeText}
                                onChange={e => setComposeText(e.target.value.slice(0, MAX_CHARS))}
                                placeholder="Escreva algo..."
                                disabled={posting}
                                rows={3}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        handlePost();
                                    }
                                }}
                            />
                            <div className={s.composeFooter}>
                                <span className={`${s.composeCharCount} ${composeText.length > MAX_CHARS - 20 ? s.composeCharCountWarn : ''}`}>
                                    {composeText.length}/{MAX_CHARS}
                                </span>
                                <button
                                    className={s.composeBtn}
                                    onClick={handlePost}
                                    disabled={posting || !composeText.trim() || !wsConnected}
                                >
                                    {posting ? 'Enviando...' : 'Publicar'}
                                </button>
                            </div>
                        </div>

                        {/* Feed */}
                        {!wsConnected && feedLoading ? (
                            <div className={s.connectingState}>
                                <div className={s.connectingDots}>
                                    <span /><span /><span />
                                </div>
                                <span>Conectando ao servidor...</span>
                            </div>
                        ) : feedLoading ? (
                            <FeedSkeleton />
                        ) : posts.length === 0 ? (
                            <div className={s.emptyState}>
                                <div className={s.emptyIcon}>
                                    <img src="/icons-95/message_tack.ico" alt="" className={s.emptyIco} />
                                </div>
                                <span className={s.emptyTitle}>O mural esta vazio</span>
                                <span className={s.emptySubtitle}>Seja o primeiro a postar!</span>
                            </div>
                        ) : (
                            <div className={s.feedList}>
                                {posts.map(p => (
                                    <PostRow
                                        key={p.id}
                                        post={p}
                                        onOpenThread={navigateThread}
                                        onLike={toggleLike}
                                        onOpenProfile={navigateProfile}
                                        onDelete={handleDelete}
                                        liked={likedSet.has(p.id)}
                                        isNew={newPostIds.has(p.id)}
                                        isOwner={user.username === p.author}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Status bar */}
            <div className={s.statusbar}>
                <div className={s.statusSection}>
                    {feedLoading ? 'Carregando...' : `${posts.length} posts`}
                </div>
                <div className={s.statusSection}>
                    {user.username}
                </div>
                <div className={s.statusSection} style={{ marginLeft: 'auto' }}>
                    <img
                        src={`/icons-95/${wsConnected ? 'conn_pcs_on_on' : 'conn_pcs_off_off'}.ico`}
                        alt=""
                        className={s.statusIco}
                    />
                    {wsConnected ? 'Online' : 'Reconectando'}
                </div>
            </div>
        </div>
    );
};

export default Forum;
