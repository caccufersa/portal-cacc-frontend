'use client';

import { useEffect, useState } from 'react';
import { useWindows } from '@/context/WindowsContext';
import StartMenu from '@/components/StartMenu/StartMenu';
import styles from './Taskbar.module.css';

export default function Taskbar() {
    const { windows, activeWindowId, startMenuOpen, setStartMenuOpen, focusWindow, restoreWindow, minimizeWindow } = useWindows();
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
        };
        updateDateTime();
        const interval = setInterval(updateDateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const openWindows = windows.filter(w => w.isOpen);

    const handleWindowClick = (id: string) => {
        const window = windows.find(w => w.id === id);
        if (!window) return;

        if (window.isMinimized) {
            restoreWindow(id);
        } else if (activeWindowId === id) {
            minimizeWindow(id);
        } else {
            focusWindow(id);
        }
    };

    const handleStartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setStartMenuOpen(!startMenuOpen);
    };

    return (
        <>
            {startMenuOpen && <StartMenu />}
            <div className={styles.taskbar} onClick={(e) => e.stopPropagation()}>
                <button
                    className={`${styles.startButton} ${startMenuOpen ? styles.startButtonActive : ''}`}
                    onClick={handleStartClick}
                >
                    <span className={styles.startLogo}>🖥️</span>
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
                            <span className={styles.windowButtonIcon}>{w.icon}</span>
                            <span className={styles.windowButtonText}>{w.title}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.systemTray}>
                    <span className={styles.trayIcon} title="Volume">🔊</span>
                    <span className={styles.trayIcon} title="Rede">🌐</span>
                    <div className={styles.clockContainer} title={date}>
                        <span className={styles.clock}>{time}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
