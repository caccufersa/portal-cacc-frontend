'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import s from '../Forum.module.css';

export default function AuthScreen() {
    const { login, register, error, clearError, isLoading } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const resetFields = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPw('');
        clearError();
        setSuccessMsg('');
    };

    const switchMode = (m: 'login' | 'register') => {
        resetFields();
        setMode(m);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMsg('');
        if (!username.trim() || !password) return;

        if (mode === 'register') {
            if (password !== confirmPw) return;
            if (password.length < 4) return;
            if (!email.trim()) return;
            const result = await register(username.trim(), email.trim(), password);
            if (result?.success) {
                setSuccessMsg('Conta criada! Faca login.');
                setTimeout(() => switchMode('login'), 1200);
            }
        } else {
            await login(username.trim(), password);
        }
    };

    const isReg = mode === 'register';
    const pwMismatch = isReg && confirmPw.length > 0 && password !== confirmPw;

    return (
        <div className={s.loginWrap}>
            <div className={s.loginBox}>
                <div className={s.loginHeader}>
                    <img src="/icons-95/key_padlock.ico" alt="" />
                    {isReg ? 'Criar Conta' : 'Entrar na Rede'}
                </div>

                <div className={s.authTabs}>
                    <button
                        type="button"
                        className={`${s.authTab} ${!isReg ? s.authTabActive : ''}`}
                        onClick={() => switchMode('login')}
                        disabled={isLoading}
                    >
                        Entrar
                    </button>
                    <button
                        type="button"
                        className={`${s.authTab} ${isReg ? s.authTabActive : ''}`}
                        onClick={() => switchMode('register')}
                        disabled={isLoading}
                    >
                        Criar Conta
                    </button>
                </div>

                <form className={s.loginBody} onSubmit={handleSubmit}>
                    <div className={s.loginIcon}>
                        <img src={isReg ? '/icons-95/users.ico' : '/icons-95/users_key.ico'} alt="" />
                    </div>

                    <div>
                        <div className={s.loginLabel}>Usuario:</div>
                        <input
                            className={s.loginInput}
                            value={username}
                            onChange={e => { setUsername(e.target.value); clearError(); setSuccessMsg(''); }}
                            placeholder="seu_usuario"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {isReg && (
                        <div>
                            <div className={s.loginLabel}>E-mail:</div>
                            <input
                                className={s.loginInput}
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); clearError(); }}
                                placeholder="seu@email.com"
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    <div>
                        <div className={s.loginLabel}>Senha:</div>
                        <input
                            className={s.loginInput}
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); clearError(); setSuccessMsg(''); }}
                            placeholder="********"
                            disabled={isLoading}
                        />
                    </div>

                    {isReg && (
                        <div>
                            <div className={s.loginLabel}>Confirmar Senha:</div>
                            <input
                                className={s.loginInput}
                                type="password"
                                value={confirmPw}
                                onChange={e => { setConfirmPw(e.target.value); clearError(); }}
                                placeholder="********"
                                disabled={isLoading}
                            />
                            {pwMismatch && (
                                <div style={{ color: '#c00', fontSize: 13, marginTop: 3 }}>As senhas nao coincidem</div>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className={s.loginError}>
                            <img src="/icons-95/msg_error.ico" alt="" style={{ width: 16, height: 16 }} />
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className={s.loginSuccess}>
                            <img src="/icons-95/check.ico" alt="" style={{ width: 16, height: 16 }} />
                            {successMsg}
                        </div>
                    )}

                    <div className={s.loginBtns}>
                        <button
                            type="submit"
                            className={s.toolbarBtn}
                            disabled={isLoading || !username.trim() || !password || (isReg && (pwMismatch || !confirmPw || !email.trim()))}
                        >
                            {isLoading ? 'Aguarde...' : isReg ? 'Criar Conta' : 'OK'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
