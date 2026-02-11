'use client';

import React, { useState, useEffect } from 'react';
import type { Noticia } from './types';
import { CATEGORIAS } from './types';
import { fetchNoticia } from './api';
import { ListSkeleton } from './Skeletons';
import s from '../News.module.css';

function formatFull(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function NewsDetail({
    id,
    onBack,
}: {
    id: number;
    onBack: () => void;
}) {
    const [noticia, setNoticia] = useState<Noticia | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        fetchNoticia(id).then(data => {
            if (!active) return;
            setNoticia(data);
            setLoading(false);
        });
        return () => { active = false; };
    }, [id]);

    if (loading) {
        return (
            <>
                <button className={s.backBtn} onClick={onBack}>Voltar</button>
                <ListSkeleton />
            </>
        );
    }

    if (!noticia) {
        return (
            <>
                <button className={s.backBtn} onClick={onBack}>Voltar</button>
                <div className={s.emptyState}>
                    <img src="/icons-95/msg_error.ico" alt="" />
                    Noticia nao encontrada
                </div>
            </>
        );
    }

    const cat = CATEGORIAS[noticia.categoria] || CATEGORIAS.geral;

    return (
        <div className={s.detail}>
            <button className={s.backBtn} onClick={onBack}>Voltar as Noticias</button>

            <div className={s.detailHeader}>
                <div className={s.detailTitle}>{noticia.titulo}</div>
                <div className={s.detailMeta}>
                    <span className={s.detailMetaItem}>
                        <img src="/icons-95/user_world.ico" alt="" className={s.detailMetaIcon} />
                        {noticia.author}
                    </span>
                    <span className={s.detailMetaItem}>
                        <img src="/icons-95/calendar.ico" alt="" className={s.detailMetaIcon} />
                        {formatFull(noticia.created_at)}
                    </span>
                    <span className={s.detailMetaItem}>
                        <img src={cat.icon} alt="" className={s.detailMetaIcon} />
                        {cat.label}
                    </span>
                    {noticia.destaque && (
                        <span className={`${s.newsTag} ${s.newsTagDestaque}`}>DESTAQUE</span>
                    )}
                </div>
            </div>

            {noticia.image_url && (
                <img src={noticia.image_url} alt="" className={s.detailImage} />
            )}

            <div className={s.detailBody}>{noticia.conteudo}</div>
        </div>
    );
}
