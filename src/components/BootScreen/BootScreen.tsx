'use client';

import { useState, useEffect } from 'react';
import styles from './BootScreen.module.css';

export default function BootScreen() {
    const [loadingText, setLoadingText] = useState('Iniciando CACC OS...');

    useEffect(() => {
        const texts = [
            'Iniciando CACC OS...',
            'Carregando componentes...',
            'Preparando área de trabalho...',
            'Quase lá...'
        ];

        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % texts.length;
            setLoadingText(texts[index]);
        }, 600);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.bootScreen}>
            <h1 className={styles.title}>CACC 95</h1>
            <p className={styles.subtitle}>Centro Acadêmico de Ciência da Computação</p>

            <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>{loadingText}</p>
                <div className={styles.loadingBar}>
                    <div className={styles.loadingFill}></div>
                </div>
            </div>

            <p className={styles.copyright}>
                © 2025 CACC UFERSA - Todos os direitos reservados
            </p>
        </div>
    );
}
