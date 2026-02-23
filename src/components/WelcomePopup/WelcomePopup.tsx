'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './WelcomePopup.module.css';

interface WelcomePopupProps {
    onClose: () => void;
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('cacc-welcome-hidden', 'true');
        }
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dontShowAgain]);

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <div className={styles.titleBar}>
                    <div className={styles.titleContent}>
                        <span className={styles.titleIcon}>
                            <Image src="/icons-95/msinfo32.ico" alt="" width={16} height={16} />
                        </span>
                        <span className={styles.titleText}>Bem-vindo ao CACC!</span>
                    </div>
                    <button className={styles.closeButton} onClick={handleClose}>×</button>
                </div>

                <div className={styles.content}>
                    <span className={styles.iconLarge}>
                        <Image src="/icons-95/computer.ico" alt="" width={48} height={48} />
                    </span>
                    <div className={styles.textContent}>
                        <div className={styles.rowtitle}>
                            <h2>Olá, Calouro! 👋</h2>
                            <Image src="/gifs/linux.gif" alt="pinguim" width={64} height={64} className={styles.gifIcon} />
                        </div>
                        <p>
                            Seja muito bem-vindo ao <span className={styles.highlight}>CACC</span> -
                            <span className={styles.underlineHighlight}>Centro Acadêmico de Ciência da Computação da UFERSA!</span>
                        </p>
                        <p>
                            Este é o seu portal de informações sobre o curso. Navegue pelos
                            ícones na área de trabalho para descobrir tudo sobre sua nova jornada!
                        </p>

                        <div className={styles.tips}>
                            <h3>💡 Dicas Rápidas:</h3>
                            <ul>
                                <li>Clique duas vezes nos ícones para abrir</li>
                                <li>Arraste as janelas pela barra de título</li>
                                <li>Redimensione pelas bordas da janela</li>
                                <li>Use o Menu Iniciar para acesso rápido</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            className={styles.checkboxInput}
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        Não mostrar novamente
                    </label>
                    <button className={styles.okButton} onClick={handleClose}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
