'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { resetPassword, isLoading } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError('Nenhum token encontrado na URL. Esse link pode estar incompleto.');
            return;
        }

        if (newPassword.length < 8) {
            setError('A nova senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (newPassword !== confirmPw) {
            setError('As senhas digitadas não coincidem.');
            return;
        }

        const ok = await resetPassword(token, newPassword);
        if (ok) {
            setSuccess(true);
            setTimeout(() => router.push('/'), 4000);
        } else {
            setError('Falha na redefinição de senha ou token expirou.');
        }
    };

    if (success) {
        return (
            <div style={{ textAlign: 'center', padding: '16px' }}>
                <img src="/icons-95/msg_info.ico" alt="Sucesso" style={{ width: 32, height: 32, marginBottom: 12 }} />
                <h3 style={{ margin: '0 0 16px' }}>Senha redefinida com sucesso!</h3>
                <p style={{ margin: 0, fontSize: 13 }}>Sua senha foi atualizada. Redirecionando para a página principal...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <img src="/icons-95/key_padlock.ico" alt="Key" style={{ width: 32, height: 32 }} />
                <div>
                    <strong>Criar Nova Senha</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Digite sua nova senha de acesso.</div>
                </div>
            </div>

            <div style={{ padding: '8px', border: '2px solid', borderTopColor: '#808080', borderLeftColor: '#808080', borderRightColor: '#fff', borderBottomColor: '#fff', background: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 13 }}>
                    Nova Senha:
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                        style={{ padding: '4px', border: '2px inset #fff' }}
                    />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 13 }}>
                    Confirmar Senha:
                    <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        disabled={isLoading}
                        style={{ padding: '4px', border: '2px inset #fff' }}
                    />
                </label>
            </div>

            {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c00', fontSize: 12, fontWeight: 'bold' }}>
                    <img src="/icons-95/msg_error.ico" alt="Erro" style={{ width: 16, height: 16 }} />
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                    type="submit"
                    disabled={isLoading || !token}
                    style={{
                        padding: '4px 16px', fontWeight: 'bold', cursor: 'pointer',
                        borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderBottom: '2px solid #808080', borderRight: '2px solid #808080', background: '#dfdfdf'
                    }}
                >
                    {isLoading ? 'Aguarde...' : 'Salvar Senha'}
                </button>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div style={{
            minHeight: '100vh', width: '100vw', background: '#008080',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontFamily: 'MS Sans Serif, Arial, sans-serif'
        }}>
            <div style={{
                background: '#c0c0c0', border: '2px solid',
                borderTopColor: '#fff', borderLeftColor: '#fff',
                borderBottomColor: '#000', borderRightColor: '#000',
                width: 380, boxShadow: '4px 4px 8px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    background: '#000080', color: '#fff', padding: '4px 8px',
                    fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>Redefinição de Senha – Rede CACC</span>
                </div>

                <Suspense fallback={<div style={{ padding: 20 }}>Carregando dados...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
