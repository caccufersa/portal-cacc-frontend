'use client';

import React from 'react';
import type { Noticia } from './types';
import { CATEGORIAS } from './types';
import s from '../News.module.css';

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewsCard({
    noticia,
    onClick,
}: {
    noticia: Noticia;
    onClick: () => void;
}) {
    const cat = CATEGORIAS[noticia.categoria] || CATEGORIAS.geral;

    return (
        <div className={s.newsItem} onClick={onClick}>
            <div className={s.newsThumb}>
                {noticia.image_url ? (
                    <img src={noticia.image_url} alt="" className={s.newsThumbImg} />
                ) : (
                    <img src={cat.icon} alt="" className={s.newsThumbFallback} />
                )}
            </div>
            <div className={s.newsBody}>
                <div className={s.newsTitle}>{noticia.titulo}</div>
                <div className={s.newsResumo}>{noticia.resumo}</div>
                <div className={s.newsMeta}>
                    <span className={`${s.newsTag} ${noticia.destaque ? s.newsTagDestaque : ''}`}>
                        {noticia.destaque ? 'DESTAQUE' : cat.label}
                    </span>
                    <span>{noticia.author}</span>
                    <span>{formatDate(noticia.created_at)}</span>
                </div>
            </div>
        </div>
    );
}
