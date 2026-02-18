'use client';

import type { Noticia } from './types';
import { getCategoria } from './types';
import s from '../News.module.css';

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewsCard({
    noticia,
    onClick,
    index,
}: {
    noticia: Noticia;
    onClick: () => void;
    index: number;
}) {
    const cat = getCategoria(noticia.categoria);

    return (
        <div className={s.newsItem} onClick={onClick} style={{ animationDelay: `${Math.min(index * 0.03, 0.18)}s` }}>
            <div className={s.newsThumb}>
                {noticia.image_url ? (
                    <img src={noticia.image_url} alt="" className={s.newsThumbImg} />
                ) : (
                    <img src={cat.icon} alt="" className={s.newsThumbFallback} />
                )}
            </div>

            <div className={s.newsBody}>
                <div className={s.newsTitle}>{noticia.titulo}</div>
                <p className={s.newsResumo}>{noticia.resumo}</p>
                <div className={s.newsMeta}>
                    <span className={s.newsMetaItem}>
                        <img src="/icons-95/user_world.ico" alt="" className={s.newsMetaIcon} />
                        {noticia.author}
                    </span>
                    <span className={s.newsMetaItem}>
                        <img src="/icons-95/calendar.ico" alt="" className={s.newsMetaIcon} />
                        {formatDate(noticia.created_at)}
                    </span>
                    {noticia.destaque && (
                        <span className={`${s.newsTag} ${s.newsTagDestaque}`}>★ DESTAQUE</span>
                    )}
                    {!noticia.destaque && (
                        <span className={s.newsTag}>{cat.label}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
