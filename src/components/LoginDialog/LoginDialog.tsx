'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginDialog.module.css';

interface LoginDialogProps {
    onClose: () => void;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginDialog({ onClose }: LoginDialogProps) {
    const { login, register, forgotPassword, AUTH_API, error, clearError, isLoading } = useAuth();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [forgotSent, setForgotSent] = useState('');

    const dialogRef = useRef<HTMLDivElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);

    const resetFields = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPw('');
        setForgotSent('');
        clearError();
    };

    const switchMode = (m: 'login' | 'register' | 'forgot') => {
        resetFields();
        setMode(m);
        setTimeout(() => usernameRef.current?.focus(), 50);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'register') {
            if (!username.trim() || !email.trim() || !password || password !== confirmPw || password.length < 8) return;
            if (!USERNAME_RE.test(username.trim()) || !EMAIL_RE.test(email.trim())) return;
            const result = await register(username.trim(), email.trim(), password);
            if (result.success) {
                onClose();
            }
        } else if (mode === 'forgot') {
            if (!email.trim() || !EMAIL_RE.test(email.trim())) return;
            const ok = await forgotPassword(email.trim());
            if (ok) {
                setForgotSent('Se uma conta com esse e-mail existir, você receberá um link de redefinição em breve.');
            }
        } else {
            if (!username.trim() || !password) return;
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
    const isForgot = mode === 'forgot';
    const pwMismatch = isReg && confirmPw.length > 0 && password !== confirmPw;
    const pwTooShort = isReg && password.length > 0 && password.length < 8;
    const usernameInvalid = isReg && username.length > 0 && !USERNAME_RE.test(username);
    const emailInvalid = (isReg || isForgot) && email.length > 0 && !EMAIL_RE.test(email);

    const canSubmit =
        !isLoading &&
        (isForgot
            ? email.trim().length > 0 && !emailInvalid
            : username.trim().length > 0 && password.length > 0 &&
            (!isReg || (email.trim().length > 0 && !emailInvalid && confirmPw.length > 0 && !pwMismatch && !pwTooShort && !usernameInvalid))
        );

    const titleText = isReg ? 'Criar Conta – Rede CACC' : isForgot ? 'Recuperar Acesso – CACC' : 'Entrar na Rede CACC';
    const bannerIcon = isReg ? '/icons-95/users_key.ico' : isForgot ? '/icons-95/key_padlock_help.ico' : '/icons-95/key_win.ico';
    const bannerTitle = isReg ? 'Nova conta de usuario' : isForgot ? 'Recuperação de Senha' : 'Bem-vindo de volta';
    const bannerSubtitle = isReg
        ? 'Preencha os dados (incluindo e-mail obrigatório) para criar conta.'
        : isForgot
            ? 'Informe seu e-mail para receber um link de redefinição temporário.'
            : 'Digite seu usuário e senha para continuar ou acesse com o Google.';

    if (forgotSent) {
        return (
            <div className={styles.overlay}>
                <div className={styles.dialog} ref={dialogRef}>
                    <div className={styles.titleBar}>
                        <span className={styles.titleText}>E-mail Enviado</span>
                        <button className={styles.closeBtn} onClick={onClose} title="Fechar">✕</button>
                    </div>
                    <div className={styles.banner}>
                        <img src="/icons-95/msg_info.ico" alt="" className={styles.bannerIcon} />
                        <div className={styles.bannerText}>
                            <div className={styles.bannerTitle}>Verifique sua caixa de entrada</div>
                            <div className={styles.bannerSubtitle}>{forgotSent}</div>
                        </div>
                    </div>
                    <div className={styles.body}>
                        <div className={styles.separator} />
                        <div className={styles.footer}>
                            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>OK</button>
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
                        <img src="/icons-95/keys.ico" alt="" style={{ width: 16, height: 16 }} />
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${isReg ? styles.tabActive : ''}`}
                        onClick={() => switchMode('register')}
                        disabled={isLoading}
                    >
                        <img src="/icons-95/users_green.ico" alt="" style={{ width: 16, height: 16 }} />
                        Criar Conta
                    </button>
                    <button
                        type="button"
                        className={`${styles.tab} ${isForgot ? styles.tabActive : ''}`}
                        onClick={() => switchMode('forgot')}
                        disabled={isLoading}
                    >
                        <img src="/icons-95/key_world.ico" alt="" style={{ width: 16, height: 16 }} />
                        Esqueci a Senha
                    </button>
                </div>

                <form className={styles.body} onSubmit={handleSubmit}>
                    {!isForgot && (
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
                    )}

                    {(isReg || isForgot) && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldRow}>
                                <span className={styles.label}>E-mail:</span>
                                <input
                                    ref={isForgot ? usernameRef : undefined}
                                    className={`${styles.input} ${emailInvalid ? styles.inputError : ''}`}
                                    type="email"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); clearError(); }}
                                    placeholder="seu_email@exemplo.com"
                                    disabled={isLoading}
                                />
                            </label>
                            {emailInvalid && (
                                <div className={styles.hint}>E-mail invalido</div>
                            )}
                        </div>
                    )}

                    {!isForgot && (
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

                    {error && (
                        <div className={styles.errorBox}>
                            <img src="/icons-95/msg_error.ico" alt="" className={styles.errorIcon} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!isReg && !isForgot && (
                        <>
                            <div className={styles.dividerLine}>Ou continue com</div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    className={`${styles.btn}`}
                                    style={{ width: '100%', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
                                    disabled={isLoading}
                                    onClick={() => {
                                        window.location.href = `${AUTH_API}/auth/google`;
                                    }}
                                >
                                    <img src="/icons-95/google.svg" alt="G" style={{ width: 22, height: 22 }} />
                                    <span>
                                        Entrar com{' '}
                                        <span style={{ color: '#4285F4' }}>G</span>
                                        <span style={{ color: '#EA4335' }}>o</span>
                                        <span style={{ color: '#FBBC05' }}>o</span>
                                        <span style={{ color: '#4285F4' }}>g</span>
                                        <span style={{ color: '#34A853' }}>l</span>
                                        <span style={{ color: '#EA4335' }}>e</span>
                                    </span>
                                </button>
                            </div>
                        </>
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
                                    : isForgot
                                        ? 'Enviar Link'
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
