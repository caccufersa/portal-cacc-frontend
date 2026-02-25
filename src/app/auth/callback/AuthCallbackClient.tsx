'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackClient() {
    const router = useRouter();
    const { forceLoginSession } = useAuth();
    const [status, setStatus] = useState('Processando login com Google...');
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;

        const processCallback = async () => {
            hasProcessed.current = true;
            try {
                // 1. Extrair o access_token do Hash da URL (fragment)
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                const accessToken = params.get('access_token');
                const error = params.get('error');

                if (error) {
                    setStatus(`Erro no login: ${error}`);
                    setTimeout(() => router.push('/'), 3000);
                    return;
                }

                if (!accessToken) {
                    setStatus('Nenhum token encontrado. Redirecionando...');
                    setTimeout(() => router.push('/'), 2000);
                    return;
                }

                // 2. Limpar o hash da URL e setar validando
                window.history.replaceState(null, document.title, window.location.pathname);
                setStatus('Validando sessão...');

                // 3. Buscar os dados reaiis do User via /auth/session passando o token explicitamente
                const AUTH_API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';
                const res = await fetch(`${AUTH_API}/auth/session`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.user) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        forceLoginSession(accessToken, data.user as any);
                        setStatus('Login efetuado! Redirecionando...');
                        router.push('/');
                        return;
                    }
                }

                setStatus('Falha ao obter perfil. Redirecionando...');
                setTimeout(() => router.push('/'), 2000);

            } catch (err: unknown) {
                console.error('Callback error:', err);
                const msg = err instanceof Error ? err.message : 'Erro desconhecido';
                setStatus(`Falha: ${msg}`);
                setTimeout(() => router.push('/'), 3000);
            }
        };

        processCallback();
    }, [router, forceLoginSession]);

    return (
        <div style={{
            height: '100vh', width: '100vw', background: '#008080',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                background: '#c0c0c0', padding: '20px', border: '2px solid',
                borderTopColor: '#fff', borderLeftColor: '#fff',
                borderBottomColor: '#808080', borderRightColor: '#808080',
                width: 320, fontFamily: 'MS Sans Serif, Arial, sans-serif'
            }}>
                <div style={{
                    background: '#000080', color: '#fff', padding: '4px 8px',
                    fontWeight: 'bold', marginBottom: '16px'
                }}>
                    Autenticação do Sistema
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/icons-95/msagent.ico" alt="Wait" style={{ width: 32, height: 32 }} />
                    <span style={{ fontSize: '14px' }}>{status}</span>
                </div>
            </div>
        </div>
    );
}
