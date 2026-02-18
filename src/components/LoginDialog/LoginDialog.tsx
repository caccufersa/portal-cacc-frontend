'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginDialog.module.css';

interface LoginDialogProps {
    onClose: () => void;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export default function LoginDialog({ onClose }: LoginDialogProps) {
    const { login, register, error, clearError, isLoading } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const dialogRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);

    const resetFields = () => {
        setUsername('');
        setPassword('');
        setConfirmPw('');
        clearError();
    };

    const switchMode = (m: 'login' | 'register') => {
        resetFields();
        setMode(m);
        setTimeout(() => usernameRef.current?.focus(), 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) return;

        if (mode === 'register') {
            if (password !== confirmPw) return;
            if (password.length < 8) return;
            if (!USERNAME_RE.test(username.trim())) return;
            const ok = await register(username.trim(), password);
            if (ok) onClose();
        } else {
            const ok = await login(username.trim(), password);
            if (ok) onClose();
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const isReg = mode === 'register';
    const pwMismatch = isReg && confirmPw.length > 0 && password !== confirmPw;
    const pwTooShort = isReg && password.length > 0 && password.length < 8;
    const usernameInvalid = isReg && username.length > 0 && !USERNAME_RE.test(username);

    const canSubmit =
        !isLoading &&
        username.trim().length > 0 &&
        password.length > 0 &&
        (!isReg || (confirmPw.length > 0 && !pwMismatch && !pwTooShort && !usernameInvalid));

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog} ref={dialogRef}>
                <div className={styles.titleBar}>
                    <img src="/icons-95/key_padlock.ico" alt="" className={styles.titleIcon} />
                    <span className={styles.titleText}>
                        {isReg ? 'Criar Conta – Rede CACC' : 'Entrar na Rede CACC'}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose} title="Fechar">✕</button>
                </div>

                <div className={styles.banner}>
                    <img
                        src={isReg ? '/icons-95/users.ico' : '/icons-95/users_key.ico'}
                        alt=""
                        className={styles.bannerIcon}
                    />
                    <div className={styles.bannerText}>
                        <div className={styles.bannerTitle}>
                            {isReg ? 'Nova conta de usuario' : 'Bem-vindo de volta'}
                        </div>
                        <div className={styles.bannerSubtitle}>
                            {isReg
                                ? 'Preencha os dados para se registrar na rede.'
                                : 'Digite seu usuario e senha para continuar.'
                            }
                        </div>
                    </div>
                </div>

                <div className={styles.tabStrip}>
                    <button
                        type="button"
                        className={`${styles.tab} ${!isReg ? styles.tabActive : ''}`}
                        onClick={() => switchMode('login')}
                        disabled={isLoading}
                    >
                        <img src="/icons-95/key_win.ico" alt="" className={styles.tabIcon} />
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${isReg ? styles.tabActive : ''}`}
                        onClick={() => switchMode('register')}
                        disabled={isLoading}
                    >
                        <img src="/icons-95/users.ico" alt="" className={styles.tabIcon} />
                        Criar Conta
                    </button>
                </div>

                <form className={styles.body} onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldRow}>
                            <span className={styles.label}>Usuario:</span>
                            <input
                                ref={usernameRef}
                                className={`${styles.input} ${usernameInvalid ? styles.inputError : ''}`}
                                value={username}
                                onChange={e => { setUsername(e.target.value); clearError(); }}
                                placeholder="seu_usuario"
                                autoFocus
                                disabled={isLoading}
                                maxLength={30}
                            />
                        </label>
                        {usernameInvalid && (
                            <div className={styles.hint}>3-30 caracteres: letras, numeros, _ ou -</div>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldRow}>
                            <span className={styles.label}>Senha:</span>
                            <input
                                className={`${styles.input} ${pwTooShort ? styles.inputError : ''}`}
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); clearError(); }}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </label>
                        {pwTooShort && (
                            <div className={styles.hint}>Minimo 8 caracteres</div>
                        )}
                    </div>

                    {isReg && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldRow}>
                                <span className={styles.label}>Confirmar:</span>
                                <input
                                    className={`${styles.input} ${pwMismatch ? styles.inputError : ''}`}
                                    type="password"
                                    value={confirmPw}
                                    onChange={e => { setConfirmPw(e.target.value); clearError(); }}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                            </label>
                            {pwMismatch && (
                                <div className={styles.hint}>As senhas nao coincidem</div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorBox}>
                            <img src="/icons-95/msg_error.ico" alt="" className={styles.errorIcon} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={styles.separator} />

                    <div className={styles.footer}>
                        <button
                            type="submit"
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            disabled={!canSubmit}
                        >
                            {isLoading ? 'Aguarde...' : isReg ? 'Registrar' : 'OK'}
                        </button>
                        <button
                            type="button"
                            className={styles.btn}
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
