'use client';

import dynamic from 'next/dynamic';

// Carrega o componente APENAS no client, nunca no servidor.
// Isso impede que o Next.js tente pre-renderizar uma página
// que depende de AuthProvider (contexto só existente no browser).
const AuthCallbackClient = dynamic(() => import('./AuthCallbackClient'), { ssr: false });

export default function AuthCallbackPage() {
    return <AuthCallbackClient />;
}
