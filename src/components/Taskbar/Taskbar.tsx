'use client';

import { useEffect, useState } from 'react';
import { useWindows } from '@/context/WindowsContext';
import StartMenu from '@/components/StartMenu/StartMenu';
import styles from './Taskbar.module.css';
import { AlertDialog } from '../Dialog/Dialog';
export default function Taskbar() {
    const [alertOpen, setAlertOpen] = useState(false);
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
                    <span className={styles.trayIcon} title="Volume">
                      <button className={styles.volumeButton} onClick={alertOpen ? () => setAlertOpen(false) : () => setAlertOpen(true)}>
                        <img src="/icons-95/loudspeaker_rays.ico" alt="Volume" style={{ width: '16px', height: '16px' }} />
                        </button>
                    </span>
                    <span className={styles.trayIcon} title="Rede">
                     <button className={styles.networkButton} onClick={alertOpen ? () => setAlertOpen(false) : () => setAlertOpen(true)}>
                        <img src="/icons-95/world.ico" alt="Rede" style={{ width: '16px', height: '16px' }} />
                        </button>  
                    </span>
                    {alertOpen && (
                        <AlertDialog
                            title="Em breve"
                            message="Obrigado por ser curioso, em breve adicionaremos novas features."
                            type="info"
                            onOk={() => setAlertOpen(false)}
                        />
                    )}
                    <div className={styles.clockContainer} title={date}>
                        <span className={styles.clock}>{time}</span>
                    </div>
                </div>
            </div>
        </>
    );
}
