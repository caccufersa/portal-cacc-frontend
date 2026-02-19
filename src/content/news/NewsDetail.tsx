'use client';

import { useState, useEffect, JSX, createElement } from 'react';
import type { Noticia, EditorJSData } from './types';
import { getCategoria } from './types';
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

function renderEditorJS(data: EditorJSData): JSX.Element[] {
    return data.blocks.map((block, idx) => {
        switch (block.type) {
            case 'header': {
                const data = block.data as { level?: number; text: string };
                const level = Math.min(Math.max(data.level || 2, 1), 6);
                return createElement(
                    `h${level}`,
                    { key: idx, className: s.detailHeading },
                    data.text
                );
            }

            case 'paragraph': {
                const data = block.data as { text: string };
                return <p key={idx} className={s.detailParagraph} dangerouslySetInnerHTML={{ __html: data.text }} />;
            }

            case 'list': {
                const data = block.data as { style: string; items: string[] };
                const ListTag = data.style === 'ordered' ? 'ol' : 'ul';
                return (
                    <ListTag key={idx} className={s.detailList}>
                        {data.items.map((item: string, i: number) => (
                            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                        ))}
                    </ListTag>
                );
            }

            case 'checklist': {
                const data = block.data as { items: { text: string; checked: boolean }[] };
                return (
                    <ul key={idx} className={s.detailChecklist}>
                        {(data.items || []).map((item: { text: string; checked: boolean }, i: number) => (
                            <li key={i} className={item.checked ? s.detailChecklistChecked : ''}>
                                <span>{item.checked ? '☑' : '☐'}</span>
                                <span dangerouslySetInnerHTML={{ __html: item.text }} />
                            </li>
                        ))}
                    </ul>
                );
            }

            case 'quote': {
                const data = block.data as { text: string; caption: string };
                return (
                    <blockquote key={idx} className={s.detailQuote}>
                        <p dangerouslySetInnerHTML={{ __html: data.text }} />
                        {data.caption && (
                            <cite className={s.detailQuoteCaption}>{data.caption}</cite>
                        )}
                    </blockquote>
                );
            }

            case 'image': {
                const data = block.data as { file?: { url: string }; url?: string; caption: string };
                return (
                    <figure key={idx} className={s.detailFigure}>
                        <img src={data.file?.url || data.url} alt="" className={s.detailContentImage} />
                        {data.caption && (
                            <figcaption className={s.detailFigcaption}>{data.caption}</figcaption>
                        )}
                    </figure>
                );
            }

            case 'code': {
                const data = block.data as { code: string };
                return (
                    <pre key={idx} className={s.detailCode}>
                        <code>{data.code}</code>
                    </pre>
                );
            }

            case 'raw': {
                const data = block.data as { html: string };
                return (
                    <div
                        key={idx}
                        className={s.detailRawHtml}
                        dangerouslySetInnerHTML={{ __html: data.html || '' }}
                    />
                );
            }

            case 'embed': {
                const data = block.data as { embed: string; width: number; height: number; caption: string };
                return (
                    <figure key={idx} className={s.detailFigure}>
                        <iframe
                            src={data.embed}
                            width={data.width || '100%'}
                            height={data.height || 320}
                            className={s.detailEmbed}
                            title={data.caption || 'Embed'}
                            allowFullScreen
                        />
                        {data.caption && (
                            <figcaption className={s.detailFigcaption}>{data.caption}</figcaption>
                        )}
                    </figure>
                );
            }

            case 'table': {
                const data = block.data as { content: string[][]; withHeadings: boolean };
                const rows: string[][] = data.content || [];
                return (
                    <div key={idx} className={s.detailTableWrap}>
                        <table className={s.detailTable}>
                            {data.withHeadings && rows.length > 0 && (
                                <thead>
                                    <tr>
                                        {rows[0].map((cell: string, ci: number) => (
                                            <th key={ci} dangerouslySetInnerHTML={{ __html: cell }} />
                                        ))}
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {(data.withHeadings ? rows.slice(1) : rows).map((row: string[], ri: number) => (
                                    <tr key={ri}>
                                        {row.map((cell: string, ci: number) => (
                                            <td key={ci} dangerouslySetInnerHTML={{ __html: cell }} />
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            case 'warning': {
                const data = block.data as { title: string; message: string };
                return (
                    <div key={idx} className={s.detailWarning}>
                        <div className={s.detailWarningTitle}>
                            <img src="/icons-95/msg_warning.ico" alt="" style={{ width: 16, height: 16 }} />
                            {data.title}
                        </div>
                        <p dangerouslySetInnerHTML={{ __html: data.message }} />
                    </div>
                );
            }

            case 'linkTool': {
                const data = block.data as { link: string; meta: { title: string; description: string } };
                return (
                    <a
                        key={idx}
                        href={data.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.detailLink}
                    >
                        <span className={s.detailLinkTitle}>{data.meta?.title || data.link}</span>
                        {data.meta?.description && (
                            <span className={s.detailLinkDesc}>{data.meta.description}</span>
                        )}
                    </a>
                );
            }

            case 'delimiter':
                return <hr key={idx} className={s.detailDelimiter} />;

            default: {
                // Fallback: se tem text ou html, renderiza; senão ignora
                const data = block.data as { text?: string; html?: string };
                if (data.text) {
                    return <p key={idx} className={s.detailParagraph} dangerouslySetInnerHTML={{ __html: data.text }} />;
                }
                if (data.html) {
                    return <div key={idx} className={s.detailRawHtml} dangerouslySetInnerHTML={{ __html: data.html }} />;
                }
                // Bloco vazio ou desconhecido — não mostrar JSON
                return <div key={idx} />;
            }
        }
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
            if (data && data.conteudo && !data.conteudo_obj) {
                try {
                    data.conteudo_obj = JSON.parse(data.conteudo);
                } catch {
                    // Se não for JSON válido, mantém como texto simples
                }
            }
            setNoticia(data);
            setLoading(false);
        });
        return () => { active = false; };
    }, [id]);

    if (loading) {
        return (
            <>
                <button className={s.backBtn} onClick={onBack}>← Voltar</button>
                <ListSkeleton />
            </>
        );
    }

    if (!noticia) {
        return (
            <>
                <button className={s.backBtn} onClick={onBack}>← Voltar</button>
                <div className={s.emptyState}>
                    <img src="/icons-95/msg_error.ico" alt="Erro" />
                    Noticia nao encontrada
                </div>
            </>
        );
    }

    const cat = getCategoria(noticia.categoria);

    return (
        <div className={s.detail}>
            <button className={s.backBtn} onClick={onBack}>← Voltar</button>

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
                        <span className={`${s.newsTag} ${s.newsTagDestaque}`}>★ DESTAQUE</span>
                    )}
                </div>
                {noticia.tags && noticia.tags.length > 0 && (
                    <div className={s.detailTags}>
                        {noticia.tags.map((tag, i) => (
                            <span key={i} className={s.detailTagBadge}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {noticia.image_url && (
                <img src={noticia.image_url} alt="Imagem da notícia" className={s.detailImage} />
            )}

            <div className={s.detailBody}>
                {noticia.conteudo_html ? (
                    <div dangerouslySetInnerHTML={{ __html: noticia.conteudo_html }} />
                ) : noticia.conteudo_obj ? (
                    renderEditorJS(noticia.conteudo_obj)
                ) : (
                    <div className={s.detailParagraph}>{noticia.conteudo}</div>
                )}
            </div>
        </div>
    );
}
