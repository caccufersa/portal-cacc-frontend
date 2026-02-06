import React, { useState, useEffect } from 'react';

interface Suggestion {
    id: number;
    author: string;
    texto: string;
    data_criacao: string;
}

const Sugest: React.FC = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [author, setAuthor] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const winGray = '#c0c0c0';
    const winDark = '#808080';
    const winLight = '#ffffff';

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
            borderBottom: '1px dotted #808080'
        },
        messageHeader: { 
            fontWeight: 'bold', 
            color: '#000080',
            marginBottom: '2px' 
        },
        messageBody: { 
            fontFamily: '"Courier New", monospace', 
            fontSize: '12px'
        },
        messageDate: { 
            fontSize: '9px', 
            color: '#666', 
            marginTop: '2px',
            textAlign: 'right' as const
        }
    };

    const API_URL = 'https://backend-go-portal.onrender.com/api/sugestoes'; // HARD CODE MESMO, O BACK BLOQUEA REQUISIÇÕES DE OUTROS DOMÍNIOS, ENTÃO NAO TEM JEITO, A NÃO SER QUE O BACK SEJA CONFIGURADO PRA PERMITIR CORS DO NOSSO DOMÍNIO, MAS ISSO É PRO FUTURO, POR ENQUANTO VAI ASSIM MESMO   

    const fetchSuggestions = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            const data = await response.json();
            setSuggestions(data);
        } catch (err) {
            console.error(err);
            setSuggestions([
                { id: 1, author: 'CalouroJuninho123', texto: 'Acho que a api nao ta funcionando nao', data_criacao: new Date().toISOString() },
            ]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author || !texto) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author: author, texto: message }),
            });
            if (!response.ok) throw new Error('Failed to post suggestion');
            await fetchSuggestions();
            setAuthor('');
            setMessage('');
        } catch (err) {
            setError('Erro ao enviar dados. Por favor, tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    return (
        <div style={styles.container}>
            <fieldset style={styles.fieldset}>
                <legend style={styles.legend}>Nova Mensagem</legend>
                
                <form onSubmit={handleSubmit}>
                    <label style={styles.label}>De:</label>
                    <input
                        type="text"
                        style={styles.input}
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Seu nome aqui juninho..."
                    />

                    <label style={styles.label}>Mensagem:</label>
                    <textarea
                        style={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Digite sua sugestão..."
                    />

                    {error && <div style={{ color: 'red', marginBottom: '8px', border: '1px dotted red', padding: '2px' }}>{error}</div>}

                    <div style={styles.buttonContainer}>
                        <button type="submit" style={styles.button} disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar'}
                        </button>
                    </div>
                </form>
            </fieldset>

            <fieldset style={{...styles.fieldset, flex: 1, display: 'flex', flexDirection: 'column'}}>
                <legend style={styles.legend}>Mural de Sugestões</legend>
                
                <div style={styles.listBox}>
                    {suggestions.length === 0 ? (
                        <p style={{ padding: '5px', fontStyle: 'italic', color: '#808080' }}>Nenhuma sugestão encontrada... ALGUEM ESCREVA ALGO</p>
                    ) : (
                        suggestions.map((s) => (
                            <div key={s.id} style={styles.messageItem}>
                                <div style={styles.messageHeader}>&lt;{s.author}&gt; escreveu:</div>
                                <div style={styles.messageBody}>{s.texto}</div>
                                <div style={styles.messageDate}>
                                    {new Date(s.data_criacao).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ textAlign: 'right' }}>
                    <button onClick={fetchSuggestions} style={styles.button}>Atualizar</button>
                </div>
            </fieldset>
        </div>
    );
};

export default Sugest;