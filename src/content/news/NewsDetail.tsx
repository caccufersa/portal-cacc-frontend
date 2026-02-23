'use client';

import { useState, useEffect, JSX, createElement } from 'react';
import type { Noticia, EditorJSData, EditorJSBlock } from './types';
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

// Typed accessors — avoids `block.data` being `unknown` at usage sites
function blockData<T>(block: EditorJSBlock): T {
    return block.data as T;
}

function renderBlock(block: EditorJSBlock, idx: number): JSX.Element {
    switch (block.type) {
        case 'header': {
            const d = blockData<{ level?: number; text: string }>(block);
            const level = Math.min(Math.max(d.level || 2, 1), 6);
            return createElement(
                `h${level}`,
                { key: idx, className: s.detailHeading },
                d.text
            );
        }

        case 'paragraph': {
            const d = blockData<{ text: string }>(block);
            return <p key={idx} className={s.detailParagraph} dangerouslySetInnerHTML={{ __html: d.text }} />;
        }

        case 'list': {
            const d = blockData<{ style: string; items: string[] }>(block);
            const ListTag = d.style === 'ordered' ? 'ol' : 'ul';
            return (
                <ListTag key={idx} className={s.detailList}>
                    {d.items.map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                </ListTag>
            );
        }

        case 'checklist': {
            const d = blockData<{ items: { text: string; checked: boolean }[] }>(block);
            return (
                <ul key={idx} className={s.detailChecklist}>
                    {(d.items || []).map((item, i) => (
                        <li key={i} className={item.checked ? s.detailChecklistChecked : ''}>
                            <span>{item.checked ? '☑' : '☐'}</span>
                            <span dangerouslySetInnerHTML={{ __html: item.text }} />
                        </li>
                    ))}
                </ul>
            );
        }

        case 'quote': {
            const d = blockData<{ text: string; caption: string }>(block);
            return (
                <blockquote key={idx} className={s.detailQuote}>
                    <p dangerouslySetInnerHTML={{ __html: d.text }} />
                    {d.caption && (
                        <cite className={s.detailQuoteCaption}>{d.caption}</cite>
                    )}
                </blockquote>
            );
        }

        case 'image': {
            const d = blockData<{ file?: { url: string }; url?: string; caption?: string }>(block);
            return (
                <figure key={idx} className={s.detailFigure}>
                    <img src={d.file?.url || d.url} alt="" className={s.detailContentImage} />
                    {d.caption && (
                        <figcaption className={s.detailFigcaption}>{d.caption}</figcaption>
                    )}
                </figure>
            );
        }

        case 'code': {
            const d = blockData<{ code: string }>(block);
            return (
                <pre key={idx} className={s.detailCode}>
                    <code>{d.code}</code>
                </pre>
            );
        }

        case 'raw': {
            const d = blockData<{ html: string }>(block);
            return (
                <div
                    key={idx}
                    className={s.detailRawHtml}
                    dangerouslySetInnerHTML={{ __html: d.html || '' }}
                />
            );
        }

        case 'embed': {
            const d = blockData<{ embed: string; width?: number; height?: number; caption?: string }>(block);
            return (
                <figure key={idx} className={s.detailFigure}>
                    <iframe
                        src={d.embed}
                        width={d.width || '100%'}
                        height={d.height || 320}
                        className={s.detailEmbed}
                        title={d.caption || 'Embed'}
                        allowFullScreen
                    />
                    {d.caption && (
                        <figcaption className={s.detailFigcaption}>{d.caption}</figcaption>
                    )}
                </figure>
            );
        }

        case 'table': {
            const d = blockData<{ content: string[][]; withHeadings: boolean }>(block);
            const rows: string[][] = d.content || [];
            return (
                <div key={idx} className={s.detailTableWrap}>
                    <table className={s.detailTable}>
                        {d.withHeadings && rows.length > 0 && (
                            <thead>
                                <tr>
                                    {rows[0].map((cell, ci) => (
                                        <th key={ci} dangerouslySetInnerHTML={{ __html: cell }} />
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {(d.withHeadings ? rows.slice(1) : rows).map((row, ri) => (
                                <tr key={ri}>
                                    {row.map((cell, ci) => (
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
            const d = blockData<{ title: string; message: string }>(block);
            return (
                <div key={idx} className={s.detailWarning}>
                    <div className={s.detailWarningTitle}>
                        <img src="/icons-95/msg_warning.ico" alt="" style={{ width: 16, height: 16 }} />
                        {d.title}
                    </div>
                    <p dangerouslySetInnerHTML={{ __html: d.message }} />
                </div>
            );
        }

        case 'linkTool': {
            const d = blockData<{ link: string; meta?: { title?: string; description?: string } }>(block);
            return (
                <a
                    key={idx}
                    href={d.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.detailLink}
                >
                    <span className={s.detailLinkTitle}>{d.meta?.title || d.link}</span>
                    {d.meta?.description && (
                        <span className={s.detailLinkDesc}>{d.meta.description}</span>
                    )}
                </a>
            );
        }

        case 'delimiter':
            return <hr key={idx} className={s.detailDelimiter} />;

        default: {
            const d = blockData<{ text?: string; html?: string }>(block);
            if (d.text) {
                return <p key={idx} className={s.detailParagraph} dangerouslySetInnerHTML={{ __html: d.text }} />;
            }
            if (d.html) {
                return <div key={idx} className={s.detailRawHtml} dangerouslySetInnerHTML={{ __html: d.html }} />;
            }
            return <div key={idx} />;
        }
    }
}

function renderEditorJS(data: EditorJSData): JSX.Element[] {
    return data.blocks.map((block, idx) => renderBlock(block, idx));
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
                    // Not valid JSON — will render as plain text
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
