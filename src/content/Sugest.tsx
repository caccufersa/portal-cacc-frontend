import React, { useState, useEffect, useMemo } from 'react';

interface Suggestion {
    id: number;
    texto: string;
    data_criacao: string;
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
    const [author, setAuthor] = useState('');
    const [message, setMessage] = useState('');
    const [categoria, setCategoria] = useState<string>('Sugestão');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Filtros
    const [filterCategoria, setFilterCategoria] = useState<string>('Todas');
    const [filterDate, setFilterDate] = useState<string>('');

    const winGray = '#c0c0c0';
    const winDark = '#808080';
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
        }
    };

    const API_URL = 'https://sugests-portal-c.onrender.com/api/sugestoes'; // hard code por cors no backend, usar variável de ambiente em produção

    // Filtragem de sugestões
    const filteredSuggestions = useMemo(() => {
        return suggestions.filter(s => {
            const matchCategoria = filterCategoria === 'Todas' || s.categoria === filterCategoria;
            const matchDate = !filterDate || new Date(s.data_criacao).toLocaleDateString('pt-BR') === new Date(filterDate).toLocaleDateString('pt-BR');
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

    const fetchSuggestions = async () => {
        try {
            const response = await fetch(API_URL, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            const data = await response.json();
            setSuggestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author || !message || !categoria) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    author: author, 
                    texto: message,
                    categoria: categoria 
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('POST failed:', errorText);
                throw new Error('Failed to post suggestion');
            }
            
            fetchSuggestions();
            
            setAuthor('');
            setMessage('');
            setCategoria('Sugestão');
        } catch (err) {
            console.error('Error posting suggestion:', err);
            setError('Erro ao enviar dados. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
        
        const interval = setInterval(() => {
            fetchSuggestions();
        }, 3000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={styles.container}>
            <fieldset style={styles.fieldset}>
                <legend style={styles.legend}>✉ Nova Mensagem</legend>
                
                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>De:</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="JuninhoAnônimo123..."
                        required
                    />

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

            <fieldset style={{...styles.fieldset, flex: 1, display: 'flex', flexDirection: 'column'}}>
                <legend style={styles.legend}>📋 Mural de Mensagens ({filteredSuggestions.length})</legend>
                
                {/* Estatísticas */}
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

                {/* Filtros */}
                <div style={styles.filterBar}>
                    <div style={styles.filterGroup}>
                        <label style={{...styles.label, fontSize: '10px'}}>Filtrar por Categoria:</label>
                        <select
                            style={{...styles.select, width: 'auto', minWidth: '120px'}}
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
                        <label style={{...styles.label, fontSize: '10px'}}>Filtrar por Data:</label>
                        <input
                            type="date"
                            style={{...styles.input, width: 'auto', marginBottom: '0'}}
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
                            style={{...styles.button, alignSelf: 'flex-end'}}
                        >
                             Limpar
                        </button>
                    )}
                </div>
                
                <div style={styles.listBox}>
                    {suggestions.length === 0 ? (
                        <p style={{ padding: '5px', fontStyle: 'italic', color: '#808080' }}>
                            Carregando mensagens...
                        </p>
                    ) : filteredSuggestions.length === 0 ? (
                        <p style={{ padding: '5px', fontStyle: 'italic', color: '#808080' }}>
                            Nenhuma mensagem encontrada com os filtros aplicados.
                        </p>
                    ) : (
                        filteredSuggestions.map((s) => (
                            <div key={s.id} style={styles.messageItem}>
                                <div style={styles.messageHeader}>
                                    <span style={{ color: winBlue }}>
                                        👤 {s.author}
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
                                    📅 {new Date(s.data_criacao).toLocaleString('pt-BR')}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#666', alignSelf: 'center' }}>
                        Atualização automática a cada 3s
                    </span>
                    <button onClick={fetchSuggestions} style={styles.button}>
                        Atualizar
                    </button>
                </div>
            </fieldset>
        </div>
    );
};

export default Sugest;