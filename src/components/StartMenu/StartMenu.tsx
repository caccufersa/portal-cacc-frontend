'use client';

import { useState } from 'react';
import { useWindows } from '@/context/WindowsContext';
import styles from './StartMenu.module.css';

export default function StartMenu() {
    const { windows, openWindow, setStartMenuOpen } = useWindows();
    const [showProgramsSubmenu, setShowProgramsSubmenu] = useState(false);

    const handleItemClick = (id: string) => {
        openWindow(id);
        setStartMenuOpen(false);
    };

    const handleShutdown = () => {
        if (confirm('Tem certeza que deseja sair? :(')) {
            localStorage.removeItem('cacc-welcome-hidden');
            window.location.reload();
        }
    };

    const mainItems = windows.filter(w => ['about', 'courses', 'projects', 'contact', 'documents', 'help', 'balance', 'forum', 'news'].includes(w.id));
    const toolItems = windows.filter(w => ['calculator', 'notepad'].includes(w.id));

    return (
        <div className={styles.startMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sidebar}>
                <span className={styles.sidebarText}>CACC 95</span>
            </div>
            <div className={styles.menuContent}>
                <div
                    className={`${styles.menuItem} ${styles.menuItemWithArrow}`}
                    onMouseEnter={() => setShowProgramsSubmenu(true)}
                    onMouseLeave={() => setShowProgramsSubmenu(false)}
                >
                    {/*<span className={styles.menuItemIcon}>📂</span>
                    <span className={styles.menuItemText}>Programas</span>
                    <span className={styles.arrow}>▶</span>*/}

                    {showProgramsSubmenu && (
                        <div className={styles.submenu}>
                            <div className={styles.submenuHeader}>Ferramentas</div>
                            {toolItems.map(w => (
                                <button
                                    key={w.id}
                                    className={styles.menuItem}
                                    onClick={() => handleItemClick(w.id)}
                                >
                                    <span className={styles.menuItemIcon}>
                                        <img src={w.icon} alt="" style={{ width: '20px', height: '20px' }} />
                                    </span>
                                    <span className={styles.menuItemText}>{w.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.menuDivider} />

                {mainItems.map(w => (
                    <button
                        key={w.id}
                        className={styles.menuItem}
                        onClick={() => handleItemClick(w.id)}
                    >
                        <span className={styles.menuItemIcon}>
                            <img src={w.icon} alt="" style={{ width: '20px', height: '20px' }} />
                        </span>
                        <span className={styles.menuItemText}>{w.title}</span>
                    </button>
                ))}

                <div className={styles.menuDivider} />

                <button className={styles.menuItem} onClick={() => window.open('https://sigaa.ufersa.edu.br', '_blank')}>
                    <img src="icons-95/world.ico" alt="SIGAA" className={styles.menuItemIcon} />
                    <span className={styles.menuItemText}>SIGAA</span>
                </button>

                <button className={styles.menuItem} onClick={() => window.open('https://instagram.com/cacc.ufersa', '_blank')}>
                    <img src="icons-95/msn3.ico" alt="Instagram" className={styles.menuItemIcon} />
                    <span className={styles.menuItemText}>Instagram</span>
                </button>

                <div className={styles.menuDivider} />

                <button className={`${styles.menuItem} ${styles.shutdownItem}`} onClick={handleShutdown}>
                   <img src="icons-95/shut_down_with_computer.ico" alt="Desligar" className={styles.menuItemIcon} />
                    <span className={styles.menuItemText}>Desligar...</span>
                </button>
            </div>
        </div>
    );
}
