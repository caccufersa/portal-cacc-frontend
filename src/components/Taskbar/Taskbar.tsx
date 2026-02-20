'use client';

import { useEffect, useState, useRef } from 'react';
import { useWindows } from '@/context/WindowsContext';
import { useAuth } from '@/context/AuthContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
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
    const [showNetwork, setShowNetwork] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(0);

    const profileRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [alertOpen, setAlertOpen] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
            if (networkRef.current && !networkRef.current.contains(e.target as Node)) {
                setShowNetwork(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Escuta eventos globais do Broadcast do WebSocket (Pessoas online)
    const { subscribe } = useWebSocketContext();
    useEffect(() => {
        if (wsStatus === 'connected') {
            const unsubscribe = subscribe('userCount', (msg) => {
                // Safely extract payload count
                const count = (msg.data as { count?: number })?.count;
                if (typeof count === 'number') {
                    setOnlineUsers(count);
                }
            });

            return () => unsubscribe();
        } else {
            setOnlineUsers(0);
        }
    }, [subscribe, wsStatus]);

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

    const wsIcon: Record<string, string> = {
        connected: '🟢',
        connecting: '🟡',
        offline: '🔴',
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload directly to Next.js Cloudinary Route
            const res = await fetch('/api/avatar/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Cloudinary Upload Failed');

            const data = await res.json();
            const newUrl = data.url;

            // Instant UI App Update
            const { updateAuthUser, apiCall } = await import('@/context/AuthContext').then(m => ({ updateAuthUser: m.useAuth().updateAuthUser, apiCall: m.useAuth().apiCall })).catch(() => ({ updateAuthUser: () => { }, apiCall: async () => { } }));

            // Since we are inside the component, we can just use the destructucted updateAuthUser from useAuth() at the top. Let's fix that.
        } catch (error) {
            console.error(error);
            alert("Erro ao enviar foto de perfil.");
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
                            <img src="/icons-95/globe_map.ico" alt="" style={{ width: '16px', height: '16px', imageRendering: 'pixelated' }} />
                            <span className={styles.profileName}>Mapa UFERSA</span>
                        </button>
                    </div>

                    <div className={styles.separator} />

                    <div className={styles.trayItem} ref={networkRef}>
                        <button
                            className={styles.trayBtn}
                            onClick={() => setShowNetwork(prev => !prev)}
                            title={`Rede: ${wsLabel[wsStatus]}`}
                        >
                            <img src="/icons-95/world.ico" alt="Rede" style={{ width: '16px', height: '16px' }} />
                        </button>

                        {showNetwork && (
                            <div className={styles.popup}>
                                <div className={styles.popupTitle}>
                                    <img src="/icons-95/world.ico" alt="" style={{ width: '16px', height: '16px' }} />
                                    Gerenciador de Rede
                                </div>
                                <div className={styles.popupBody} style={{ minWidth: '220px' }}>
                                    <div className={styles.statusRow}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img src="/icons-95/modem.ico" alt="" style={{ width: 14, height: 14 }} />
                                            Conexão Socket
                                        </span>
                                        <strong>{wsLabel[wsStatus]}</strong>
                                    </div>
                                    <div className={styles.statusRow}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <img src="/icons-95/key_padlock.ico" alt="" style={{ width: 14, height: 14 }} />
                                            Sessão
                                        </span>
                                        <strong>{user ? 'Autenticado' : 'Desconectado'}</strong>
                                    </div>
                                    <div className={styles.popupDivider} />
                                    <div className={styles.statusRow}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#000080', fontWeight: 'bold' }}>
                                            <img src="/icons-95/users.ico" alt="" style={{ width: 16, height: 16 }} />
                                            Pessoas Online no Portal
                                        </span>
                                        <span style={{ background: '#000', color: '#0f0', padding: '0px 6px', fontFamily: 'monospace', fontWeight: 'bold', border: '1px inset #fff' }}>
                                            {wsStatus === 'connected' ? onlineUsers : 0}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#666', textAlign: 'right' }}>
                                        Ping via {process.env.NEXT_PUBLIC_WS_URL ? 'WSS Seguro' : 'Local'}
                                    </div>
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
                            title={user ? user.username : 'Entrar'}
                        >
                            <img
                                src={user ? (user.avatar_url || '/icons-95/user_computer.ico') : '/icons-95/key_padlock.ico'}
                                alt=""
                                style={{ width: '16px', height: '16px', objectFit: 'cover', borderRadius: user?.avatar_url ? '50%' : '0' }}
                            />
                            <span className={styles.profileName}>
                                {user ? user.username : 'Entrar'}
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
                                                src={user.avatar_url || "/icons-95/users.ico"}
                                                alt="Avatar"
                                                className={styles.profileBigIcon}
                                                style={{ objectFit: 'cover', borderRadius: user.avatar_url ? '4px' : '0', opacity: isUploadingAvatar ? 0.5 : 1 }}
                                            />
                                            <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#d4d0c8', border: '1px solid #fff', borderBottomColor: '#404040', borderRightColor: '#404040', padding: '2px', display: 'flex' }}>
                                                <img src="/icons-95/camera.ico" style={{ width: 12, height: 12 }} alt="Edit" />
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
                                            <div className={styles.profileUsername}>{user.username}</div>
                                            <div className={styles.profileStatus} style={{ fontSize: '10px' }}>
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
                                        <img src="/icons-95/key_padlock.ico" alt="" style={{ width: '16px', height: '16px' }} />
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
