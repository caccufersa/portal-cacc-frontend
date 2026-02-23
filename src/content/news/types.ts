export interface EditorJSBlock {
    id?: string;
    type: string;
    data: unknown;
}

export interface EditorJSData {
    time?: number;
    blocks: EditorJSBlock[];
    version?: string;
}

export interface Noticia {
    id: number;
    titulo: string;
    conteudo: string; // JSON string do Editor.js ou texto simples
    conteudo_obj?: EditorJSData; // Objeto parseado do Editor.js
    conteudo_html?: string; // HTML renderizado
    resumo: string;
    author: string;
    categoria: string;
    image_url?: string;
    destaque: boolean;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export type NewsView =
    | { type: 'list' }
    | { type: 'detail'; id: number };

export const CATEGORIAS: Record<string, { label: string; icon: string }> = {
    geral: { label: 'Geral', icon: '/icons-95/newspaper.ico' },
    evento: { label: 'Evento', icon: '/icons-95/calendar.ico' },
    academico: { label: 'Academico', icon: '/icons-95/directory_open_file_mydocs.ico' },

};

export function getCategoria(cat: string) {
    const key = cat.toLowerCase();
    return { key, ...(CATEGORIAS[key] || CATEGORIAS.geral) };
}
