'use client';

import { useEffect, useState, useRef } from 'react';
import { useWindows } from '@/context/WindowsContext';
import { useAuth } from '@/context/AuthContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { useNotifications } from '@/lib/notifications/useNotifications';
import type { NotificationItem } from '@/lib/notifications/types';
import StartMenu from '@/components/StartMenu/StartMenu';
import LoginDialog from '@/components/LoginDialog/LoginDialog';
import NewsPopup from '@/components/NewsPopup/NewsPopup';
import TutorialPopup from '@/components/TutorialPopup/TutorialPopup';
import styles from './Taskbar.module.css';
import { AlertDialog } from '../Dialog/Dialog';
import Image from 'next/image';

export default function Taskbar() {
    const { windows, activeWindowId, startMenuOpen, setStartMenuOpen, focusWindow, restoreWindow, minimizeWindow, openWindow } = useWindows();
    const { user, logout, updateAuthUser, apiCall } = useAuth();
    const { status: wsStatus } = useWebSocketContext();

    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showOnlineUsers, setShowOnlineUsers] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);

    interface OnlineUser {
        uuid: string;
        username: string;
        display_name?: string;
        avatar_url?: string;
    }
    const [onlineUserList, setOnlineUserList] = useState<OnlineUser[]>([]);

    const profileRef = useRef<HTMLDivElement>(null);
    const onlineRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [alertOpen, setAlertOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const {
        items: notifications,
        unreadCount,
        hasMore: notificationsHasMore,
        loading: notificationsLoading,
        loadingMore: notificationsLoadingMore,
        error: notificationsError,
        refresh: refreshNotifications,
        loadMore: loadMoreNotifications,
        markAllAsRead: markAllNotificationsAsRead,
    } = useNotifications({ limit: 20, autoFetch: !!user });

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
        };
        update();
        const iv = setInterval(update, 1000);
        return () => clearInterval(iv);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfile(false);
            }
            if (onlineRef.current && !onlineRef.current.contains(e.target as Node)) {
                setShowOnlineUsers(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const { subscribe, lastMessage, sendAction } = useWebSocketContext();
    useEffect(() => {
        if (wsStatus === 'connected') {
            const unsubCount = subscribe('userCount', (msg) => {
                const data = msg.data as { count?: number; users?: OnlineUser[] };
                if (typeof data.count === 'number') {
                    setOnlineUsers(data.count);
                }
                // If the backend sends the user list alongside the count, update it
                if (Array.isArray(data.users)) {
                    setOnlineUserList(data.users);
                }
            });

            // Subscribe to dedicated userList events if backend sends them separately
            const unsubList = subscribe('userList', (msg) => {
                const data = msg.data as { users?: OnlineUser[] };
                if (Array.isArray(data.users)) {
                    setOnlineUserList(data.users);
                }
            });

            return () => {
                unsubCount();
                unsubList();
            };
        } else {
            setOnlineUsers(0);
            setOnlineUserList([]);
        }
    }, [subscribe, wsStatus]);

    // O fallback usando lastMessage garante que nao percamos o evento inicial
    useEffect(() => {
        if (lastMessage?.action === 'userCount') {
            const data = lastMessage.data as { count?: number; users?: OnlineUser[] };
            if (typeof data.count === 'number') {
                setOnlineUsers(data.count);
            }
            if (Array.isArray(data.users)) {
                setOnlineUserList(data.users);
            }
        }
        if (lastMessage?.action === 'userList') {
            const data = lastMessage.data as { users?: OnlineUser[] };
            if (Array.isArray(data.users)) {
                setOnlineUserList(data.users);
            }
        }
    }, [lastMessage]);

    // Request the full user list when the online users popup opens
    const handleOpenOnlineUsers = () => {
        setShowOnlineUsers(prev => !prev);
        if (!showOnlineUsers && wsStatus === 'connected') {
            sendAction('getOnlineUsers').catch(() => {
                // Backend may not support this action yet — ignore
            });
        }
    };

    const openWindows = windows.filter(w => w.isOpen);

    const handleWindowClick = (id: string) => {
        const w = windows.find(win => win.id === id);
        if (!w) return;
        if (w.isMinimized) restoreWindow(id);
        else if (activeWindowId === id) minimizeWindow(id);
        else focusWindow(id);
    };

    const handleStartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setStartMenuOpen(!startMenuOpen);
    };

    const wsLabel: Record<string, string> = {
        connected: 'Conectado',
        connecting: 'Conectando…',
        offline: 'Offline',
    };

    const getNotificationMessage = (item: NotificationItem): string => {
        const actorName = item.actor_name?.trim() || 'Alguém';
        const baseText: Record<string, string> = {
            reply: 'respondeu seu post',
            repost: 'repostou seu conteúdo',
            mention: 'mencionou você',
            like: 'curtiu sua publicação',
        };
        const action = baseText[item.type] ?? 'interagiu com você';
        return `${actorName} ${action}`;
    };

    const focusForum = () => {
        const forumWindow = windows.find((w) => w.id === 'forum');
        if (forumWindow?.isOpen) {
            if (forumWindow.isMinimized) restoreWindow('forum');
            else if (activeWindowId !== 'forum') focusWindow('forum');
        } else {
            openWindow('forum');
        }
    };

    const handleToggleNotifications = () => {
        if (!user) {
            setShowLogin(true);
            return;
        }

        const willOpen = !showNotifications;
        setShowNotifications(willOpen);

        if (willOpen) {
            void refreshNotifications({ markAsRead: true });
        }
    };

    const handleNotificationClick = () => {
        setShowNotifications(false);
        focusForum();
    };


    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload to Cloudinary via Next.js route
            const res = await fetch('/api/avatar/upload', {
                method: 'POST',
                body: formData
            });

            // Always parse JSON — even on error, we might have gotten a url
            let data: { url?: string; error?: string } = {};
            try {
                data = await res.json();
            } catch {
                console.error('[Avatar] Could not parse upload response');
            }

            console.log('[Avatar] Upload response:', res.status, data);

            const newUrl = data.url;
            if (!newUrl) {
                console.error('[Avatar] No URL returned:', data.error);
                alert(`Erro no upload: ${data.error ?? 'sem URL retornada'}`);
                return;
            }

            // 1. Update UI immediately
            updateAuthUser({ avatar_url: newUrl });

            // 2. Persist to backend (independently — don't let this block or revert the UI)
            try {
                const AUTH_API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';
                await apiCall(`${AUTH_API}/social/profile`, {
                    method: 'PUT',
                    body: JSON.stringify({ avatar_url: newUrl }),
                });
                console.log('[Avatar] Persisted to backend:', newUrl);
            } catch (backendErr) {
                console.error('[Avatar] Backend persist failed (UI already updated):', backendErr);
                // Don't alert — the local state is already updated, it will persist on next profile edit
            }
        } catch (error) {
            console.error('[Avatar] Upload error:', error);
            alert('Erro ao enviar foto de perfil. Verifique o console para detalhes.');
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };


    return (
        <>
            {startMenuOpen && <StartMenu />}
            {showLogin && <LoginDialog onClose={() => setShowLogin(false)} />}

            <div className={styles.taskbar} onClick={(e) => e.stopPropagation()}>
                <button
                    className={`${styles.startButton} ${startMenuOpen ? styles.startButtonActive : ''}`}
                    onClick={handleStartClick}
                >
                    <img src="/icons-95/windows.ico" alt="Iniciar" className={styles.startLogo} style={{ width: '20px', height: '20px' }} />
                    <span>Iniciar</span>
                </button>

                <div className={styles.separator} />

                <div className={styles.windowList}>
                    {openWindows.map(w => (
                        <button
                            key={w.id}
                            className={`${styles.windowButton} ${activeWindowId === w.id && !w.isMinimized ? styles.windowButtonActive : ''}`}
                            onClick={() => handleWindowClick(w.id)}
                            title={w.title}
                        >
                            <span className={styles.windowButtonIcon}>
                                <img src={w.icon} alt="" style={{ width: '16px', height: '16px' }} />
                            </span>
                            <span className={styles.windowButtonText}>{w.title}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.systemTray}>
                    <div className={styles.trayItem}>
                        <button
                            className={styles.profileBtn}
                            onClick={() => {
                                const mapWindow = windows.find(w => w.id === 'map');
                                if (mapWindow?.isOpen) {
                                    if (mapWindow.isMinimized) restoreWindow('map');
                                    else if (activeWindowId === 'map') minimizeWindow('map');
                                    else focusWindow('map');
                                } else openWindow('map');
                            }}
                            title="Mapa UFERSA"
                        >
                            <img src="/icons-95/gps.ico" alt="" style={{ width: '16px', height: '16px', imageRendering: 'pixelated' }} />
                            <span className={styles.profileName}>Mapa UFERSA</span>
                        </button>
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.trayItem} ref={onlineRef}>
                        <div
                            className={`${styles.onlineBadge} ${styles.trayConnStatus}`}
                            title="Pessoas Online no Portal"
                            onClick={handleOpenOnlineUsers}
                        >
                            <span className={`${styles.onlineBadgeDot} ${wsStatus !== 'connected' ? styles.onlineBadgeOff : ''}`} />
                            <span className={styles.onlineBadgeText}>
                                {wsStatus === 'connected' ? Math.max(1, onlineUsers) : '—'}
                            </span>
                        </div>

                        {showOnlineUsers && (
                            <div className={styles.onlinePopup}>
                                <div className={styles.onlinePopupTitle}>
                                    <img src="/icons-95/users.ico" alt="" style={{ width: '16px', height: '16px' }} />
                                    Pessoas Online
                                    <span className={styles.onlinePopupTitleCount}>
                                        {wsStatus === 'connected' ? Math.max(1, onlineUsers) : 0}
                                    </span>
                                </div>
                                <div className={styles.onlineUsersList}>
                                    {wsStatus !== 'connected' ? (
                                        <div className={styles.onlineEmptyMsg}>
                                            <img src="/icons-95/modem.ico" alt="" style={{ width: 16, height: 16, marginBottom: 4 }} />
                                            <br />
                                            Desconectado do servidor
                                        </div>
                                    ) : onlineUserList.length > 0 ? (
                                        onlineUserList.map((u) => (
                                            <div key={u.uuid} className={styles.onlineUserItem}>
                                                <div className={styles.onlineUserAvatar}>
                                                    {u.avatar_url ? (
                                                        <img src={u.avatar_url} alt="" />
                                                    ) : (
                                                        (u.display_name || u.username || '?')[0].toUpperCase()
                                                    )}
                                                </div>
                                                <span className={styles.onlineUserName}>
                                                    {u.display_name || u.username}
                                                </span>
                                                <span className={styles.onlineDot} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.onlineEmptyMsg}>
                                            <img src="/icons-95/users.ico" alt="" style={{ width: 16, height: 16, opacity: 0.5, marginBottom: 4 }} />
                                            <br />
                                            {Math.max(1, onlineUsers)} pessoa{onlineUsers !== 1 ? 's' : ''} online
                                            <br />
                                            <span style={{ fontSize: '10px', color: '#999' }}>Lista de usuários em breve</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ borderTop: '1px dotted #808080', margin: '4px 6px 0', padding: '6px 0 2px' }}>
                                    <div className={styles.statusRow} style={{ padding: '4px 8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img src="/icons-95/world.ico" alt="" style={{ width: 14, height: 14 }} />
                                            Rede
                                        </span>
                                        <strong>{wsLabel[wsStatus]}</strong>
                                    </div>
                                    <div className={styles.statusRow} style={{ padding: '4px 8px', borderBottom: 'none' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img src="/icons-95/key_padlock.ico" alt="" style={{ width: 14, height: 14 }} />
                                            Sessão
                                        </span>
                                        <strong>{user ? 'Autenticado' : 'Desconectado'}</strong>
                                    </div>
                                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#666', textAlign: 'center', padding: '0 8px 4px' }}>
                                        Servidor em {process.env.NEXT_PUBLIC_WS_URL ? 'WSS Seguro' : 'Conexão Local'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.trayItem} ref={notificationsRef}>
                        <button
                            className={styles.trayBtn}
                            onClick={handleToggleNotifications}
                            title={user ? 'Notificações' : 'Faça login para ver notificações'}
                        >
                            <img src="/icons-95/envelope_closed.ico" alt="Notificações" style={{ width: '16px', height: '16px' }} />
                            {user && unreadCount > 0 && (
                                <span className={styles.notificationsBadge}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && user && (
                            <div className={styles.notificationsPopup}>
                                <div className={styles.notificationsPopupTitle}>
                                    <img src="/icons-95/envelope_closed.ico" alt="" style={{ width: '16px', height: '16px' }} />
                                    Notificações
                                    <span className={styles.notificationsPopupTitleCount}>{unreadCount}</span>
                                </div>

                                <div className={styles.notificationsList}>
                                    {notificationsLoading ? (
                                        <div className={styles.notificationsEmptyMsg}>Carregando notificações...</div>
                                    ) : notificationsError ? (
                                        <div className={styles.notificationsErrorMsg}>{notificationsError}</div>
                                    ) : notifications.length === 0 ? (
                                        <div className={styles.notificationsEmptyMsg}>
                                            Você não possui notificações no momento.
                                        </div>
                                    ) : (
                                        notifications.map((item) => (
                                            <button
                                                key={item.id}
                                                className={`${styles.notificationItem} ${item.is_read ? '' : styles.notificationUnread}`}
                                                onClick={handleNotificationClick}
                                            >
                                                <div className={styles.notificationAvatar}>
                                                    {item.actor_avatar ? (
                                                        <img src={item.actor_avatar} alt="" />
                                                    ) : (
                                                        (item.actor_name || '?').charAt(0).toUpperCase()
                                                    )}
                                                </div>

                                                <div className={styles.notificationBody}>
                                                    <div className={styles.notificationText}>{getNotificationMessage(item)}</div>
                                                    <div className={styles.notificationMeta}>
                                                        {new Date(item.created_at).toLocaleString('pt-BR')}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className={styles.notificationsActions}>
                                    <button
                                        className={styles.notificationsActionBtn}
                                        onClick={() => {
                                            void markAllNotificationsAsRead();
                                        }}
                                        disabled={notificationsLoading || notifications.length === 0}
                                    >
                                        Marcar como lidas
                                    </button>

                                    {notificationsHasMore && (
                                        <button
                                            className={styles.notificationsActionBtn}
                                            onClick={() => {
                                                void loadMoreNotifications();
                                            }}
                                            disabled={notificationsLoadingMore}
                                        >
                                            {notificationsLoadingMore ? 'Carregando...' : 'Carregar mais'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <span className={styles.trayIcon} title="Volume">
                        <button className={styles.volumeButton} onClick={alertOpen ? () => setAlertOpen(false) : () => setAlertOpen(true)}>
                            <img src="/icons-95/loudspeaker_rays.ico" alt="Volume" style={{ width: '16px', height: '16px' }} />
                        </button>
                    </span>
                    <div className={styles.separator} />
                    {alertOpen && (
                        <>
                            <AlertDialog
                                title="Em breve"
                                message="Obrigado por ser curioso, em breve adicionaremos novas features."
                                type="info"
                                onOk={() => setAlertOpen(false)}
                                Image={() => <Image src="/images/cat.jpg" alt="info" height={128} width={256} />}
                            />
                        </>
                    )}



                    <NewsPopup />
                    <div className={styles.separator} />

                    <div className={styles.trayItem} ref={profileRef}>
                        <TutorialPopup />
                        <button
                            className={styles.profileBtn}
                            onClick={() => {
                                if (user) setShowProfile(prev => !prev);
                                else setShowLogin(true);
                            }}
                            title={user ? (user.display_name || user.username) : 'Entrar'}
                        >
                            <div style={{
                                width: 18, height: 18, borderRadius: '50%',
                                background: user?.avatar_url ? 'transparent' : '#000080',
                                border: '1px solid #404040',
                                overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, fontSize: 10, color: '#fff', fontWeight: 'bold',
                            }}>
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : user ? (
                                    (user.display_name || user.username)[0].toUpperCase()
                                ) : (
                                    <img src="/icons-95/key_world.ico" alt="" style={{ width: '14px', height: '14px' }} />
                                )}
                            </div>
                            <span className={styles.profileName}>
                                {user ? (user.display_name || user.username) : 'Entrar'}
                            </span>
                        </button>

                        {showProfile && user && (
                            <div className={styles.popup}>
                                <div className={styles.popupTitle}>
                                    <img src="/icons-95/user_computer.ico" alt="" style={{ width: '16px', height: '16px' }} />
                                    Perfil do Usuário
                                </div>
                                <div className={styles.popupBody}>
                                    <div className={styles.profileInfo}>
                                        <div
                                            style={{ position: 'relative', cursor: 'pointer' }}
                                            onClick={() => fileInputRef.current?.click()}
                                            title="Clique para alterar a foto do perfil"
                                        >
                                            <img
                                                src={user.avatar_url || "/icons-95/user_computer.ico"}
                                                alt="Avatar"
                                                className={styles.profileBigIcon}
                                                style={{ objectFit: 'cover', borderRadius: user.avatar_url ? '2px' : '0', opacity: isUploadingAvatar ? 0.3 : 1 }}
                                            />
                                            {isUploadingAvatar && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#fff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 2px #000',
                                                    fontFamily: 'monospace'
                                                }}>
                                                    Wait...
                                                </div>
                                            )}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                background: '#d4d0c8',
                                                borderTop: '1px solid #fff',
                                                borderLeft: '1px solid #fff',
                                                borderBottom: '1px outset #000',
                                                borderRight: '1px outset #000',
                                                width: 14,
                                                height: 14,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                fontFamily: 'monospace',
                                                color: '#008000',
                                                lineHeight: 1
                                            }} title="Alterar Foto">
                                                +
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg, image/gif"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleAvatarUpload}
                                        />
                                        <div>
                                            <div className={styles.profileUsername} style={{ fontWeight: 'bold' }}>{user.display_name || user.username}</div>
                                            <div className={styles.profileUsername} style={{ fontSize: '10px', marginTop: '2px', color: '#666' }}>@{user.username}</div>
                                            <div className={styles.profileStatus} style={{ fontSize: '10px', marginTop: '4px' }}>
                                                Membro Registrado
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.popupDivider} />
                                    <button
                                        className={styles.popupAction}
                                        onClick={() => {
                                            setShowProfile(false);
                                            logout();
                                        }}
                                    >
                                        <img src="/icons-95/key_world.ico" alt="" style={{ width: '16px', height: '16px' }} />
                                        Sair
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.separator} />


                    <div className={styles.clockContainer} title={date}>
                        <span className={styles.clock}>{time}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
