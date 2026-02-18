'use client';

import { useEffect, useState, useRef } from 'react';
import { useWindows } from '@/context/WindowsContext';
import { useAuth } from '@/context/AuthContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import StartMenu from '@/components/StartMenu/StartMenu';
import LoginDialog from '@/components/LoginDialog/LoginDialog';
import NewsPopup from '@/components/NewsPopup/NewsPopup';
import styles from './Taskbar.module.css';
import { AlertDialog } from '../Dialog/Dialog';
import Image from 'next/image';

export default function Taskbar() {
    const { windows, activeWindowId, startMenuOpen, setStartMenuOpen, focusWindow, restoreWindow, minimizeWindow } = useWindows();
    const { user, logout } = useAuth();
    const { status: wsStatus } = useWebSocketContext();

    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showNetwork, setShowNetwork] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<HTMLDivElement>(null);

    const [alertOpen, setAlertOpen] = useState(false);

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
                                    Status da Rede
                                </div>
                                <div className={styles.popupBody}>
                                    <div className={styles.statusRow}>
                                        <span>WebSocket:</span>
                                        <span>{wsIcon[wsStatus]} {wsLabel[wsStatus]}</span>
                                    </div>
                                    <div className={styles.statusRow}>
                                        <span>Auth Hub:</span>
                                        <span>{user ? '🟢 Autenticado' : '🔴 Desconectado'}</span>
                                    </div>
                                    <div className={styles.statusRow}>
                                        <span>Servicos:</span>
                                        <span>Forum, Noticias, Sugestoes</span>
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
                        <button
                            className={styles.profileBtn}
                            onClick={() => {
                                if (user) setShowProfile(prev => !prev);
                                else setShowLogin(true);
                            }}
                            title={user ? user.username : 'Entrar'}
                        >
                            <img
                                src={user ? '/icons-95/user_computer.ico' : '/icons-95/key_padlock.ico'}
                                alt=""
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span className={styles.profileName}>
                                {user ? user.username : 'Entrar'}
                            </span>
                        </button>

                        {showProfile && user && (
                            <div className={styles.popup}>
                                <div className={styles.popupTitle}>
                                    <img src="/icons-95/user_computer.ico" alt="" style={{ width: '16px', height: '16px' }} />
                                    Perfil
                                </div>
                                <div className={styles.popupBody}>
                                    <div className={styles.profileInfo}>
                                        <img src="/icons-95/users.ico" alt="" className={styles.profileBigIcon} />
                                        <div>
                                            <div className={styles.profileUsername}>{user.username}</div>
                                            <div className={styles.profileStatus}>
                                                {wsIcon[wsStatus]} {wsLabel[wsStatus]}
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
