'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginDialog.module.css';

interface LoginDialogProps {
    onClose: () => void;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;

export default function LoginDialog({ onClose }: LoginDialogProps) {
    const { login, register, resetPassword, error, clearError, isLoading } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [shownRecoveryKey, setShownRecoveryKey] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);

    const resetFields = () => {
        setUsername('');
        setPassword('');
        setConfirmPw('');
        setRecoveryKey('');
        setNewPassword('');
        setShownRecoveryKey(null);
        clearError();
    };

    const switchMode = (m: 'login' | 'register' | 'reset') => {
        resetFields();
        setMode(m);
        setTimeout(() => usernameRef.current?.focus(), 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        if (mode === 'register') {
            if (!password || password !== confirmPw || password.length < 8) return;
            if (!USERNAME_RE.test(username.trim())) return;
            const result = await register(username.trim(), password);
            if (result.success) {
                if (result.recoveryKey) {
                    setShownRecoveryKey(result.recoveryKey);
                } else {
                    onClose();
                }
            }
        } else if (mode === 'reset') {
            if (!recoveryKey.trim() || !newPassword || newPassword.length < 8) return;
            const ok = await resetPassword(username.trim(), recoveryKey.trim(), newPassword);
            if (ok) {
                switchMode('login');
            }
        } else {
            if (!password) return;
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
    const isReset = mode === 'reset';
    const pwMismatch = isReg && confirmPw.length > 0 && password !== confirmPw;
    const pwTooShort = isReg && password.length > 0 && password.length < 8;
    const usernameInvalid = isReg && username.length > 0 && !USERNAME_RE.test(username);
    const newPwTooShort = isReset && newPassword.length > 0 && newPassword.length < 8;

    const canSubmit =
        !isLoading &&
        username.trim().length > 0 &&
        (isReset
            ? recoveryKey.trim().length > 0 && newPassword.length >= 8
            : password.length > 0 &&
            (!isReg || (confirmPw.length > 0 && !pwMismatch && !pwTooShort && !usernameInvalid))
        );

    const titleText = isReg ? 'Criar Conta – Rede CACC' : isReset ? 'Recuperar Acesso – CACC' : 'Entrar na Rede CACC';
    const bannerIcon = isReg ? '/icons-95/msagent_file.ico' : isReset ? '/icons-95/key_padlock.ico' : '/icons-95/msagent.ico';
    const bannerTitle = isReg ? 'Nova conta de usuario' : isReset ? 'Recuperação de Senha' : 'Bem-vindo de volta';
    const bannerSubtitle = isReg
        ? 'Preencha os dados para se registrar na rede.'
        : isReset
            ? 'Use sua Chave de Recuperação para definir uma nova senha.'
            : 'Digite seu usuario e senha para continuar.';

    // --- Recovery key reveal screen after registration ---
    if (shownRecoveryKey) {
        return (
            <div className={styles.overlay}>
                <div className={styles.dialog} ref={dialogRef}>
                    <div className={styles.titleBar}>
                        <span className={styles.titleText}>Conta Criada com Sucesso!</span>
                        <button className={styles.closeBtn} onClick={onClose} title="Fechar">✕</button>
                    </div>
                    <div className={styles.banner}>
                        <img src="/icons-95/key_padlock.ico" alt="" className={styles.bannerIcon} />
                        <div className={styles.bannerText}>
                            <div className={styles.bannerTitle}>Guarde sua Chave de Recuperação!</div>
                            <div className={styles.bannerSubtitle}>Ela é a única forma de recuperar sua conta se você esquecer a senha.</div>
                        </div>
                    </div>
                    <div className={styles.body}>
                        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                            <div style={{ fontSize: 11, marginBottom: 8, color: '#666' }}>Sua chave de recuperação:</div>
                            <div style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                background: '#000080',
                                color: '#fff',
                                padding: '10px 20px',
                                letterSpacing: 4,
                                userSelect: 'all',
                                border: '2px inset #404040',
                                display: 'inline-block',
                            }}>
                                {shownRecoveryKey}
                            </div>
                            <div style={{ marginTop: 12, fontSize: 11, color: '#c00', fontWeight: 'bold' }}>
                                ⚠ Anote em um lugar seguro. Ela não será exibida novamente!
                            </div>
                        </div>
                        <div className={styles.separator} />
                        <div className={styles.footer}>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={onClose}
                            >
                                Entendi, vou guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog} ref={dialogRef}>
                <div className={styles.titleBar}>
                    <span className={styles.titleText}>{titleText}</span>
                    <button className={styles.closeBtn} onClick={onClose} title="Fechar">✕</button>
                </div>

                <div className={styles.banner}>
                    <img src={bannerIcon} alt="" className={styles.bannerIcon} />
                    <div className={styles.bannerText}>
                        <div className={styles.bannerTitle}>{bannerTitle}</div>
                        <div className={styles.bannerSubtitle}>{bannerSubtitle}</div>
                    </div>
                </div>

                <div className={styles.tabStrip}>
                    <button
                        type="button"
                        className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
                        onClick={() => switchMode('login')}
                        disabled={isLoading}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${isReg ? styles.tabActive : ''}`}
                        onClick={() => switchMode('register')}
                        disabled={isLoading}
                    >
                        Criar Conta
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${isReset ? styles.tabActive : ''}`}
                        onClick={() => switchMode('reset')}
                        disabled={isLoading}
                    >
                        Esqueci a Senha
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

                    {!isReset && (
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
                    )}

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

                    {isReset && (
                        <>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldRow}>
                                    <span className={styles.label}>Chave:</span>
                                    <input
                                        className={styles.input}
                                        value={recoveryKey}
                                        onChange={e => { setRecoveryKey(e.target.value.toUpperCase()); clearError(); }}
                                        placeholder="CACC-1A2B3C4D"
                                        disabled={isLoading}
                                        maxLength={14}
                                        style={{ fontFamily: 'monospace', letterSpacing: 2 }}
                                    />
                                </label>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldRow}>
                                    <span className={styles.label}>Nova Senha:</span>
                                    <input
                                        className={`${styles.input} ${newPwTooShort ? styles.inputError : ''}`}
                                        type="password"
                                        value={newPassword}
                                        onChange={e => { setNewPassword(e.target.value); clearError(); }}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                    />
                                </label>
                                {newPwTooShort && (
                                    <div className={styles.hint}>Minimo 8 caracteres</div>
                                )}
                            </div>
                        </>
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
                            {isLoading
                                ? 'Aguarde...'
                                : isReg
                                    ? 'Registrar'
                                    : isReset
                                        ? 'Redefinir Senha'
                                        : 'OK'}
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
