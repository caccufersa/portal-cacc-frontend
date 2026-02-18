'use client';

import React, { useState, useEffect } from 'react';
import type { Noticia, NewsView } from './types';
import { CATEGORIAS } from './types';
import { fetchNoticias, fetchDestaques } from './api';
import NewsCard from './NewsCard';
import NewsDetail from './NewsDetail';
import { ListSkeleton } from './Skeletons';
import s from '../News.module.css';

const News: React.FC = () => {
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [destaques, setDestaques] = useState<Noticia[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<NewsView>({ type: 'list' });
    const [catFilter, setCatFilter] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            const [list, dest] = await Promise.all([fetchNoticias(), fetchDestaques()]);
            if (!active) return;
            setNoticias(list);
            setDestaques(dest);
            setLoading(false);
        })();
        return () => { active = false; };
    }, []);

    const filtered = catFilter
        ? noticias.filter(n => n.categoria.toLowerCase() === catFilter)
        : noticias;

    const topDestaque = destaques.length > 0 ? destaques[0] : null;

    return (
        <div className={s.container}>
            <div className={s.catBar}>
                <button
                    className={`${s.catBtn} ${catFilter === null ? s.catBtnActive : ''}`}
                    onClick={() => setCatFilter(null)}
                >
                    Todas
                </button>
                {Object.entries(CATEGORIAS).map(([key, val]) => (
                    <button
                        key={key}
                        className={`${s.catBtn} ${catFilter === key ? s.catBtnActive : ''}`}
                        onClick={() => setCatFilter(catFilter === key ? null : key)}
                    >
                        <img src={val.icon} alt="" className={s.catIcon} />
                        {val.label}
                    </button>
                ))}
            </div>

            <div className={s.content}>
                {view.type === 'detail' ? (
                    <NewsDetail id={view.id} onBack={() => setView({ type: 'list' })} />
                ) : (
                    <>
                        {topDestaque && !catFilter && (
                            <div
                                className={s.featuredBanner}
                                onClick={() => setView({ type: 'detail', id: topDestaque.id })}
                            >
                                <div className={s.featuredText}>
                                    <div className={s.featuredLabel}>Destaque</div>
                                    <div className={s.featuredTitle}>{topDestaque.titulo}</div>
                                </div>
                                <span className={s.featuredArrow}>→</span>
                            </div>
                        )}

                        <div className={s.newsList}>
                            {loading ? (
                                <ListSkeleton />
                            ) : filtered.length === 0 ? (
                                <div className={s.emptyState}>
                                    <img src="/icons-95/message_empty_tack.ico" alt="" />
                                    <span>Nenhuma noticia encontrada.</span>
                                </div>
                            ) : (
                                filtered.map((n, idx) => (
                                    <NewsCard
                                        key={n.id}
                                        noticia={n}
                                        onClick={() => setView({ type: 'detail', id: n.id })}
                                        index={idx}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default News;
