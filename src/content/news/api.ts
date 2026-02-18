import type { Noticia } from './types';

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

export async function fetchNoticias(limit = 20, offset = 0, categoria = ''): Promise<Noticia[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (categoria) params.set('categoria', categoria);
    try {
        const res = await fetch(`${API}/noticias?${params}`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function fetchDestaques(): Promise<Noticia[]> {
    try {
        const res = await fetch(`${API}/noticias/destaques`);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function fetchNoticia(id: number): Promise<Noticia | null> {
    try {
        const res = await fetch(`${API}/noticias/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
