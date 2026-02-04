'use client';

import { useState, useEffect } from 'react';
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
    }, [dontShowAgain]);

    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <div className={styles.titleBar}>
                    <div className={styles.titleContent}>
                        <span className={styles.titleIcon}>
                            <img src="/icons-95/msinfo32.ico" alt="" style={{ width: '16px', height: '16px' }} />
                        </span>
                        <span className={styles.titleText}>Bem-vindo ao CACC!</span>
                    </div>
                    <button className={styles.closeButton} onClick={handleClose}>×</button>
                </div>

                <div className={styles.content}>
                    <span className={styles.iconLarge}>
                        <img src="/icons-95/computer.ico" alt="" style={{ width: '48px', height: '48px' }} />
                    </span>
                    <div className={styles.textContent}>
                        <h2>Olá, Calouro! 👋</h2>
                        <p>
                            Seja muito bem-vindo ao <span className={styles.highlight}>CACC</span> -
                            Centro Acadêmico de Ciência da Computação da UFERSA!
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
