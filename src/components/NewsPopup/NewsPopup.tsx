'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import type { Noticia } from '@/content/news/types';
import { getCategoria } from '@/content/news/types';
import { fetchNoticias } from '@/content/news/api';
import { useWindows } from '@/context/WindowsContext';
import styles from './NewsPopup.module.css';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export default function NewsPopup() {
    const { openWindow, focusWindow, windows } = useWindows();
    const [open, setOpen] = useState(false);
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [newsCount, setNewsCount] = useState(0);
    const [lastSeen, setLastSeen] = useState<string | null>(null);
    const lastSeenRef = useRef<string | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const list = await fetchNoticias();
                if (!active || list.length === 0) return;
                setNoticias(list.slice(0, 8));
                const seen = lastSeenRef.current || localStorage.getItem('news_last_seen');
                if (!seen) {
                    localStorage.setItem('news_last_seen', list[0].created_at);
                    lastSeenRef.current = list[0].created_at;
                    setNewsCount(list.length);
                } else {
                    const unseen = list.filter(n => new Date(n.created_at) > new Date(seen));
                    setNewsCount(unseen.length);
                }
            } catch { /* ignore */ }
        };
        load();
        const iv = setInterval(load, 120_000);
        return () => { active = false; clearInterval(iv); };
    }, []);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleToggle = () => {
        setOpen(prev => !prev);
    };

    const handleOpenNews = () => {
        // Marca como visto
        const now = new Date().toISOString();
        localStorage.setItem('news_last_seen', now);
        lastSeenRef.current = now;
        setLastSeen(now);
        setNewsCount(0);
        setOpen(false);

        const newsWindow = windows.find(w => w.id === 'news');
        if (newsWindow?.isOpen) {
            focusWindow('news');
        } else {
            openWindow('news');
        }
    };
    const handleItemClick = () => {
        handleOpenNews();
    };

    return (
        <div className={styles.wrapper} ref={popupRef}>
            <button className={styles.trayButton} onClick={handleToggle} title="Noticias">
                <Image src="/icons-95/msg_information.ico" alt="Noticias" width={16} height={16} />
                {newsCount > 0 && (
                    <span className={styles.badge}>
                        {newsCount > 9 ? '9+' : newsCount}
                    </span>
                )}
            </button>
            {open && (
                <div className={styles.popup}>
                    <div className={styles.titleBar}>
                        <Image src="/icons-95/msg_information.ico" alt="" width={16} height={16} />
                        <span className={styles.titleText}>Ultimas Noticias</span>
                        <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
                    </div>
                    {noticias.length === 0 ? (
                        <div className={styles.empty}>Nenhuma noticia ainda.</div>
                    ) : (
                        noticias.map((n) => {
                            const cat = getCategoria(n.categoria);
                            const isNew = newsCount > 0 && lastSeen
                                ? new Date(n.created_at) > new Date(lastSeen)
                                : false;

                            return (
                                <div
                                    key={n.id}
                                    className={`${styles.item} ${isNew ? styles.itemNew : ''}`}
                                    onClick={handleItemClick}
                                >
                                    <div className={styles.itemIcon}>
                                        {n.image_url ? (
                                            <Image src={n.image_url} alt="" className={styles.itemThumb} width={40} height={40} />
                                        ) : (
                                            <Image src={cat.icon} alt="" className={styles.itemCatIcon} width={40} height={40} />
                                        )}
                                    </div>
                                    <div className={styles.itemBody}>
                                        <div className={styles.itemTitle}>
                                            {isNew && <span className={styles.newDot} />}
                                            {n.titulo}
                                        </div>
                                        <div className={styles.itemMeta}>
                                            <span>{n.author}</span>
                                            <span className={styles.itemTime}>{timeAgo(n.created_at)}</span>
                                            {n.destaque && <span className={styles.itemDestaque}>★</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div className={styles.footer}>
                        <button className={styles.footerBtn} onClick={handleOpenNews}>
                            Ver todas as noticias
                        </button>
                        {newsCount > 0 && (
                            <span className={styles.footerCount}>
                                {newsCount} nova{newsCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
