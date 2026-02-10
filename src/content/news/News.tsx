'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

    const load = useCallback(async () => {
        const [list, dest] = await Promise.all([fetchNoticias(), fetchDestaques()]);
        setNoticias(list);
        setDestaques(dest);
        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        Promise.all([fetchNoticias(), fetchDestaques()]).then(([list, dest]) => {
            if (!active) return;
            setNoticias(list);
            setDestaques(dest);
            setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const filtered = catFilter
        ? noticias.filter(n => n.categoria === catFilter)
        : noticias;

    const addressText = view.type === 'detail'
        ? `cacc://noticias/${view.id}`
        : 'cacc://noticias';

    return (
        <div className={s.container}>
            <div className={s.toolbar}>
                <button
                    className={s.toolbarBtn}
                    onClick={() => { setLoading(true); load(); }}
                >
                    Atualizar
                </button>
                <div className={s.toolbarSep} />
                <button
                    className={`${s.toolbarBtn} ${view.type === 'list' ? s.toolbarBtnActive : ''}`}
                    onClick={() => setView({ type: 'list' })}
                >
                    Noticias
                </button>
                {view.type === 'detail' && (
                    <button className={s.toolbarBtn} onClick={() => setView({ type: 'list' })}>
                        Voltar
                    </button>
                )}
            </div>

            <div className={s.addressBar}>
                <span className={s.addressLabel}>Endereco:</span>
                <div className={s.addressInput}>{addressText}</div>
            </div>

            <div className={s.content}>
                {view.type === 'detail' ? (
                    <NewsDetail id={view.id} onBack={() => setView({ type: 'list' })} />
                ) : (
                    <>
                        {destaques.length > 0 && (
                            <div className={s.marqueeWrap}>
                                <div className={s.marqueeTrack}>
                                    {destaques.map((d, i) => (
                                        <React.Fragment key={d.id}>
                                            <span
                                                className={s.marqueeItem}
                                                onClick={() => setView({ type: 'detail', id: d.id })}
                                            >
                                                {d.titulo}
                                            </span>
                                            {i < destaques.length - 1 && (
                                                <span className={s.marqueeSep}>|</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}

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

                        <div className={s.newsList}>
                            {loading ? (
                                <ListSkeleton />
                            ) : filtered.length === 0 ? (
                                <div className={s.emptyState}>
                                    <img src="/icons-95/message_empty_tack.ico" alt="" />
                                    <span>Nenhuma noticia encontrada.</span>
                                </div>
                            ) : (
                                filtered.map(n => (
                                    <NewsCard
                                        key={n.id}
                                        noticia={n}
                                        onClick={() => setView({ type: 'detail', id: n.id })}
                                    />
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className={s.statusbar}>
                <div className={s.statusSection}>
                    {loading ? 'Carregando...' : `${filtered.length} noticias`}
                </div>
                <div className={s.statusSection}>
                    {catFilter ? CATEGORIAS[catFilter]?.label || catFilter : 'Todas'}
                </div>
                <div className={s.statusSection} style={{ marginLeft: 'auto' }}>
                    {view.type === 'detail' ? `Noticia #${view.id}` : 'Lista'}
                </div>
            </div>
        </div>
    );
};

export default News;
