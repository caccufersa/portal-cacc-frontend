export interface Noticia {
    id: number;
    titulo: string;
    conteudo: string;
    resumo: string;
    author: string;
    categoria: string;
    image_url?: string;
    destaque: boolean;
    created_at: string;
    updated_at: string;
}

export type NewsView =
    | { type: 'list' }
    | { type: 'detail'; id: number };

export const NEWS_API = 'https://backend-go-portal-5k1k.onrender.com/api/noticias';

export const CATEGORIAS: Record<string, { label: string; icon: string }> = {
    geral: { label: 'Geral', icon: '/icons-95/msg_information.ico' },
    evento: { label: 'Evento', icon: '/icons-95/calendar.ico' },
    academico: { label: 'Academico', icon: '/icons-95/directory_open_file_mydocs.ico' },
    cacc: { label: 'CACC', icon: '/icons-95/directory_closed.ico' },
    urgente: { label: 'Urgente', icon: '/icons-95/msg_warning.ico' },
};
