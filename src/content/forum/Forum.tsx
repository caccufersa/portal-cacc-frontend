'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import type { Post, View } from './types';
import { MAX_CHARS } from './types';
import { useForumApi } from './api';
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
    const { fetchPosts, createPost, likePost, unlikePost, deletePost, createRepost } = useForumApi();

    const [posts, setPosts] = useState<Post[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [composeText, setComposeText] = useState('');
    const [posting, setPosting] = useState(false);
    const [view, setView] = useState<View>({ type: 'feed' });
    const [newPostIds, setNewPostIds] = useState<Set<number>>(new Set());
    const [likingId, setLikingId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const feedRef = useRef<HTMLDivElement>(null);

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

    // new_reply: same as new_comment but comes from backend's "new_reply" broadcast
    // Update reply_count on the parent post in the feed and bust thread cache
    const onWsNewReply = useCallback((parentId: number, reply: Post) => {
        setPosts(prev => {
            const next = prev.map(p => {
                if (p.id !== parentId) return p;
                const replies = p.replies || [];
                if (replies.some(r => r.id === reply.id)) return p;
                return { ...p, reply_count: p.reply_count + 1, replies: [...replies, reply] };
            });
            setCache('feed:30:0', next);
            return next;
        });
        // Bust thread cache so ThreadView fetches fresh data when opened
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
        onNewReply: onWsNewReply,
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
    }, [user, wsConnected, fetchPosts]);

    const handlePost = useCallback(async () => {
        if (!composeText.trim() || posting || !user) return;
        setPosting(true);

        const text = composeText.trim();
        const tempId = optimisticPostId--;

        const optimisticPost: Post = {
            id: tempId,
            texto: text,
            author: user.username,
            author_name: user.display_name || user.username,
            user_id: 0,
            parent_id: null,
            repost_id: undefined,
            likes: 0,
            liked: false,
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
    }, [composeText, posting, user, createPost]);

    const handleLike = useCallback(async (targetId: number) => {
        if (likingId === targetId) return;

        const post = posts.find(p => p.id === targetId);
        if (!post) return;

        const isLiked = post.liked;
        const currentLikes = post.likes;
        const delta = isLiked ? -1 : 1;

        // Optimistic update
        setPosts(prev =>
            prev.map(p =>
                p.id === targetId
                    ? { ...p, likes: Math.max(0, currentLikes + delta), liked: !isLiked }
                    : p
            )
        );

        setLikingId(targetId);

        try {
            const result = isLiked ? await unlikePost(targetId) : await likePost(targetId);
            if (result) {
                setPosts(prev =>
                    prev.map(p => p.id === targetId ? { ...p, likes: result.likes } : p)
                );
            } else {
                // Revert
                setPosts(prev =>
                    prev.map(p =>
                        p.id === targetId
                            ? { ...p, likes: currentLikes, liked: isLiked }
                            : p
                    )
                );
            }
        } catch {
            // Revert
            setPosts(prev =>
                prev.map(p =>
                    p.id === targetId
                        ? { ...p, likes: currentLikes, liked: isLiked }
                        : p
                )
            );
        } finally {
            setLikingId(null);
        }
    }, [posts, likingId, likePost, unlikePost]);

    const handleDelete = useCallback((postId: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Post',
            message: 'Tem certeza que deseja excluir este post permanentemente?',
            onConfirm: async () => {
                const result = await deletePost(postId);
                if (result) {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [deletePost]);

    const handleRepost = useCallback((postId: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Repostar',
            message: 'Deseja repostar este post no seu perfil?',
            onConfirm: async () => {
                const result = await createRepost(postId);
                if (result) {
                    setPosts(prev => [result, ...prev]);
                    setNewPostIds(prev => new Set(prev).add(result.id));
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [createRepost]);

    const handleLogout = useCallback(() => {
        setConfirmModal({
            isOpen: true,
            title: 'Sair do Sistema',
            message: 'Tem certeza que deseja sair do Social CACC?',
            onConfirm: () => {
                logout();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [logout]);

    const refreshFeed = useCallback(() => {
        invalidate('feed:*');
        setFeedLoading(true);
        fetchPosts().then(data => {
            setPosts(data);
            setFeedLoading(false);
        });
    }, [fetchPosts]);

    const navigateFeed = useCallback(() => {
        setView({ type: 'feed' });
        refreshFeed();
    }, [refreshFeed]);
    const navigateThread = useCallback((id: number) => setView({ type: 'thread', id }), []);
    const navigateProfile = useCallback((username: string) => setView({ type: 'profile', username }), []);

    const filteredPosts = useMemo(() => {
        if (!searchQuery) return posts;
        const lowerQ = searchQuery.toLowerCase();
        return posts.filter(p =>
            p.texto.toLowerCase().includes(lowerQ) ||
            p.author.toLowerCase().includes(lowerQ)
        );
    }, [posts, searchQuery]);

    // addressText logic removed or kept if needed for other views? 
    // User requested to remove address bar and add search.
    // I will keep addressText calculation but not display it in JSX below.

    const addressText = useMemo(() => {
        if (view.type === 'thread') return `cacc://social/thread/${view.id}`;
        if (view.type === 'profile') return `cacc://social/user/${view.username}`;
        return 'cacc://social/feed';
    }, [view]);

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
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            <div className={s.toolbar}>
                <button className={s.toolbarBtn} onClick={refreshFeed} title="Atualizar feed">
                    <img src="/icons-95/directory_open_refresh.ico" alt="" className={s.toolbarIco} />
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
                    <div className={s.toolbarUserAvatar}>
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            user.username[0].toUpperCase()
                        )}
                    </div>
                    <span>{user.username}</span>
                    <div className={`${s.wsIndicator} ${wsConnected ? s.wsOn : s.wsOff}`} title={wsConnected ? 'Conectado' : 'Reconectando...'} />
                    <button className={s.toolbarBtnSmall} onClick={handleLogout}>
                        Sair
                    </button>
                </div>
            </div>

            {view.type === 'feed' ? (
                <div className={s.searchBar}>
                    <img src="/icons-95/search_file.ico" alt="" className={s.actionIco} style={{ width: 16, height: 16 }} />
                    <input
                        className={s.searchInput}
                        placeholder="Pesquisar posts por texto ou autor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            ) : (
                <div className={s.addressBar}>
                    <span className={s.addressLabel}>Endereco:</span>
                    <div className={s.addressInput}>{addressText}</div>
                </div>
            )}

            <div className={s.feed} ref={feedRef}>
                {view.type === 'profile' ? (
                    <ProfileView
                        username={view.username}
                        onBack={navigateFeed}
                        onOpenThread={navigateThread}
                    />
                ) : view.type === 'thread' ? (
                    <ThreadView
                        postId={view.id}
                        onBack={navigateFeed}
                        username={user.username}
                        currentUserAvatar={user.avatar_url}
                        onOpenProfile={navigateProfile}
                    />
                ) : (
                    <>
                        <div className={s.composeBox}>
                            <div className={s.composeHeader}>
                                <div className={s.composeAvatar}>
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user.username[0].toUpperCase()
                                    )}
                                </div>
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
                                {filteredPosts.map(p => (
                                    <PostRow
                                        key={p.id}
                                        post={p}
                                        onOpenThread={navigateThread}
                                        onLike={handleLike}
                                        onOpenProfile={navigateProfile}
                                        isOptimistic={likingId === p.id}
                                        onDelete={handleDelete}
                                        onRepost={handleRepost}
                                        liked={p.liked}
                                        isNew={newPostIds.has(p.id)}
                                        isOwner={user.username === p.author}
                                    />
                                ))}
                                {filteredPosts.length === 0 && searchQuery && (
                                    <div style={{ padding: 20, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                        Nenhum resultado para &quot;{searchQuery}&quot;
                                    </div>
                                )}
                            </div>
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
                    <img
                        src={`/icons-95/${wsConnected ? 'conn_pcs_on_on' : 'conn_pcs_off_off'}.ico`}
                        alt=""
                        className={s.statusIco}
                    />
                    {wsConnected ? 'Online' : 'Reconectando'}
                </div>
            </div>
        </div >
    );
};

export default Forum;
