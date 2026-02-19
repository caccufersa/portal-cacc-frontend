'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

interface Suggestion {
    id: number;
    texto: string;
    created_at: string;
    author: string;
    categoria: string;
}

const CATEGORIAS = [
    'Sugestão',
    'Reclamação',
    'Elogio',
    'Dúvida',
    'Outros'
] as const;

const Sugest: React.FC = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [message, setMessage] = useState('');
    const [categoria, setCategoria] = useState<string>('Sugestão');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [filterCategoria, setFilterCategoria] = useState<string>('Todas');
    const [filterDate, setFilterDate] = useState<string>('');

    const { accessToken } = useAuth();

    const winGray = '#c0c0c0';
    const winLight = '#ffffff';
    const winBlue = '#000080';

    // Cores por categoria
    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'Sugestão': '#008000',
            'Reclamação': '#800000',
            'Elogio': '#000080',
            'Dúvida': '#808000',
            'Outros': '#808080'
        };
        return colors[cat] || '#000000';
    };

    const styles: Record<string, React.CSSProperties> = {
        container: {
            backgroundColor: winGray,
            fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
            fontSize: '11px',
            padding: '10px',
            height: '100%',
            color: 'black',
        },
        fieldset: {
            border: `2px groove ${winLight}`,
            padding: '10px',
            marginBottom: '10px',
        },
        legend: {
            padding: '0 4px',
            marginBottom: '4px',
        },
        label: {
            display: 'block',
            marginBottom: '2px',
        },
        input: {
            width: '100%',
            padding: '3px',
            marginBottom: '8px',
            border: '2px inset #ffffff',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            outline: 'none',
            fontSize: '12px'
        },
        select: {
            width: '100%',
            padding: '3px',
            marginBottom: '8px',
            border: '2px inset #ffffff',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            outline: 'none',
            fontSize: '12px'
        },
        textarea: {
            width: '100%',
            height: '80px',
            padding: '3px',
            marginBottom: '8px',
            border: '2px inset #ffffff',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            fontSize: '12px'

        },
        button: {
            backgroundColor: winGray,
            border: '2px outset #ffffff',
            padding: '4px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'black',
            fontSize: '11px',
            minWidth: '75px'
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '6px'
        },
        filterBar: {
            display: 'flex',
            gap: '8px',
            marginBottom: '8px',
            alignItems: 'center',
            flexWrap: 'wrap' as const
        },
        filterGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '2px'
        },
        listBox: {
            border: '2px inset #ffffff',
            backgroundColor: 'white',
            height: '300px',
            overflowY: 'auto',
            padding: '4px',
        },
        messageItem: {
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px dotted #808080',
            padding: '6px',
            backgroundColor: '#f0f0f0'
        },
        messageHeader: {
            fontWeight: 'bold',
            marginBottom: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap' as const
        },
        categoryBadge: {
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 'bold' as const,
            color: 'white',
            border: '1px solid rgba(0,0,0,0.3)',
            textTransform: 'uppercase' as const
        },
        messageBody: {
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            marginTop: '4px',
            marginBottom: '4px'
        },
        messageDate: {
            fontSize: '9px',
            color: '#666',
            marginTop: '4px',
            textAlign: 'right' as const
        },
        statsBar: {
            display: 'flex',
            gap: '12px',
            padding: '6px',
            backgroundColor: '#dfdfdf',
            border: '1px solid #808080',
            marginBottom: '8px',
            fontSize: '10px',
            flexWrap: 'wrap' as const
        },
        statItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        loadingWrap: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px',
            color: '#404040',
            fontSize: '11px'
        },
        loadingBar: {
            width: '140px',
            height: '10px',
            border: '2px inset #ffffff',
            backgroundColor: 'white',
            position: 'relative' as const,
            overflow: 'hidden'
        },
        loadingBarFill: {
            position: 'absolute' as const,
            height: '100%',
            width: '40%',
            backgroundColor: winBlue,
            animation: 'loadingBar 1.2s infinite linear'
        },
        loadingDots: {
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
        }
    };

    // Filtragem de sugestões
    const filteredSuggestions = useMemo(() => {
        return suggestions.filter(s => {
            const matchCategoria = filterCategoria === 'Todas' || s.categoria === filterCategoria;
            const matchDate = !filterDate || new Date(s.created_at).toLocaleDateString('pt-BR') === new Date(filterDate).toLocaleDateString('pt-BR');
            return matchCategoria && matchDate;
        });
    }, [suggestions, filterCategoria, filterDate]);

    // Estatísticas por categoria
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        suggestions.forEach(s => {
            counts[s.categoria] = (counts[s.categoria] || 0) + 1;
        });
        return counts;
    }, [suggestions]);

    const fetchSuggestions = useCallback(async () => {
        setIsFetching(true);
        try {
            const res = await fetch(`${API}/sugestoes`);
            if (!res.ok) throw new Error('fetch failed');
            const data = await res.json();
            setSuggestions(Array.isArray(data) ? data : []);
        } catch {
            /* ignore */
        } finally {
            setIsFetching(false);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!accessToken) {
            setError('Você precisa estar logado para enviar uma sugestão.');
            return;
        }

        if (!message || !categoria) return;
        setLoading(true);

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
            const res = await fetch(`${API}/sugestoes`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ texto: message, categoria }),
            });
            if (!res.ok) throw new Error('create failed');
            const created: Suggestion = await res.json();
            setSuggestions(prev => [created, ...prev]);
            setMessage('');
            setCategoria('Sugestão');
        } catch {
            setError('Erro ao enviar dados. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [fetchSuggestions]);

    return (
        <div style={styles.container}>
            <fieldset style={styles.fieldset}>
                <legend style={styles.legend}>✉ Nova Mensagem</legend>

                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>Categoria:</label>
                    <select
                        style={styles.select}
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        required
                    >
                        {CATEGORIAS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <label style={styles.label}>Mensagem:</label>
                    <textarea
                        style={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        required
                    />

                    {error && <div style={{ color: 'red', marginBottom: '8px', border: '1px dotted red', padding: '4px', fontSize: '11px' }}>{error}</div>}

                    <div style={styles.buttonContainer}>
                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? ' Enviando...' : ' Enviar'}
                        </button>
                    </div>
                </form>
            </fieldset>

            <fieldset style={{ ...styles.fieldset, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <legend style={styles.legend}> Mural de Mensagens ({filteredSuggestions.length})</legend>

                <div style={styles.statsBar}>
                    <strong>Estatísticas:</strong>
                    {CATEGORIAS.map(cat => (
                        <div key={cat} style={styles.statItem}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: getCategoryColor(cat),
                                display: 'inline-block',
                                border: '1px solid #000'
                            }} />
                            <span>{cat}: {stats[cat] || 0}</span>
                        </div>
                    ))}
                </div>

                <div style={styles.filterBar}>
                    <div style={styles.filterGroup}>
                        <label style={{ ...styles.label, fontSize: '10px' }}>Filtrar por Categoria:</label>
                        <select
                            style={{ ...styles.select, width: 'auto', minWidth: '120px' }}
                            value={filterCategoria}
                            onChange={(e) => setFilterCategoria(e.target.value)}
                        >
                            <option value="Todas">Todas</option>
                            {CATEGORIAS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <label style={{ ...styles.label, fontSize: '10px' }}>Filtrar por Data:</label>
                        <input
                            type="date"
                            style={{ ...styles.input, width: 'auto', marginBottom: '0' }}
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>

                    {(filterCategoria !== 'Todas' || filterDate) && (
                        <button
                            onClick={() => {
                                setFilterCategoria('Todas');
                                setFilterDate('');
                            }}
                            style={{ ...styles.button, height: '30px', alignSelf: 'flex-end' }}
                        >
                            Limpar
                        </button>
                    )}
                </div>

                <div style={styles.listBox}>
                    {suggestions.length === 0 && isFetching ? (
                        <div style={styles.loadingWrap}>
                            <div>Carregando sugestões</div>
                            <div style={styles.loadingBar}>
                                <div style={styles.loadingBarFill} />
                            </div>
                            <div style={styles.loadingDots}>
                                <span className="loadingDot">●</span>
                                <span className="loadingDot">●</span>
                                <span className="loadingDot">●</span>
                            </div>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <p style={{ padding: '5px', fontStyle: 'italic', color: '#808080' }}>
                            Já deve ter mensagem, faça LOGIN PARA VISUALIZAR
                        </p>
                    ) : filteredSuggestions.length === 0 ? (
                        <p style={{ padding: '5px', fontStyle: 'italic', color: '#808080' }}>
                            Nenhuma mensagem encontrada, ALGUÉM MANDA AQUI
                        </p>
                    ) : (
                        filteredSuggestions.map((s) => (
                            <div key={s.id} style={styles.messageItem}>
                                <div style={styles.messageHeader}>
                                    <span style={{ color: winBlue }}>
                                        {s.author}
                                    </span>
                                    <span
                                        style={{
                                            ...styles.categoryBadge,
                                            backgroundColor: getCategoryColor(s.categoria)
                                        }}
                                    >
                                        {s.categoria}
                                    </span>
                                </div>
                                <div style={styles.messageBody}>{s.texto}</div>
                                <div style={styles.messageDate}>
                                    {new Date(s.created_at).toLocaleString('pt-BR')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#666', alignSelf: 'center' }}>
                        {isFetching ? 'Atualizando…' : `${suggestions.length} mensagens`}
                    </span>
                    <button onClick={fetchSuggestions} style={styles.button}>
                        Atualizar
                    </button>
                </div>
            </fieldset>
            <style jsx>{`
                @keyframes loadingBar {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
                @keyframes dotPulse {
                    0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
                    40% { opacity: 1; transform: translateY(-2px); }
                }
                .loadingDot {
                    font-size: 10px;
                    color: #000080;
                    animation: dotPulse 1s infinite ease-in-out;
                }
                .loadingDot:nth-child(2) { animation-delay: 0.2s; }
                .loadingDot:nth-child(3) { animation-delay: 0.4s; }
            `}</style>
        </div>
    );
};

export default Sugest;