'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './TutorialPopup.module.css';

export default function TutorialPopup() {
    const { user } = useAuth();
    const [hidden, setHidden] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        const isDismissed = localStorage.getItem('cacc-tutorial-login-dismissed');
        if (isDismissed) {
            setHidden(true);
        }
    }, []);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setHidden(true);
        localStorage.setItem('cacc-tutorial-login-dismissed', 'true');
    };

    if (!mounted || user || hidden) return null;

    return (
        <div className={styles.container}>
            <div className={styles.cloudGroup}>
                <div className={styles.cloudMain}>
                    <div className={styles.header}>
                        <img src="/icons-95/help_question_mark.ico" alt="Tutorial" className={styles.icon} />
                        <strong>Tutorial: Login</strong>
                        <button className={styles.closeBtn} onClick={handleClose}>X</button>
                    </div>
                    <p style={{ margin: '4px 0' }}><strong>Faça login</strong> para conectar nos serviços on-line!</p>
                    <p className={styles.subtext}>Acesse o Fórum, Galeria, Ouvidoria e Ônibus.</p>
                </div>
                <div className={styles.cloudTail1} />
                <div className={styles.cloudTail2} />
            </div>
        </div>
    );
}
