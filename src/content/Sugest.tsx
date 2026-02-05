import React, { useState, useEffect } from 'react';

interface Suggestion {
    Id: number;
    Author: string;
    Texto: string;
    CreatedAt: string;
}

const Sugest: React.FC = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [author, setAuthor] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const styles = {
        container: {
            backgroundColor: '#c0c0c0',
            fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
            padding: '10px',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
        },
        window: {
            width: '600px',
            border: '2px solid #dfdfdf',
            borderRightColor: '#404040',
            borderBottomColor: '#404040',
            backgroundColor: '#c0c0c0',
            boxShadow: '1px 1px 0 0 #000',
            marginBottom: '20px',
        },
        titleBar: {
            background: 'linear-gradient(90deg, navy, #1084d0)',
            color: 'white',
            padding: '3px 5px',
            fontWeight: 'bold' as const,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        content: {
            padding: '15px',
        },
        input: {
            width: '100%',
            padding: '4px',
            marginBottom: '10px',
            border: '2px inset #dfdfdf',
            backgroundColor: 'white',
            fontFamily: 'inherit',
        },
        textarea: {
            width: '100%',
            height: '80px',
            padding: '4px',
            marginBottom: '10px',
            border: '2px inset #dfdfdf',
            backgroundColor: 'white',
            fontFamily: 'inherit',
            resize: 'none' as const,
        },
        button: {
            backgroundColor: '#c0c0c0',
            border: '2px outset #dfdfdf',
            padding: '4px 12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 'bold' as const,
        },
        listItem: {
            border: '2px inset #dfdfdf',
            backgroundColor: 'white',
            padding: '8px',
            marginBottom: '8px',
        },
        fieldset: {
                border: '2px solid #dfdfdf',
                borderRightColor: 'white',
                borderBottomColor: 'white',
                padding: '10px',
                marginTop: '10px'
        }
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/sugestoes'; 

    const fetchSuggestions = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            const data = await response.json();
            setSuggestions(data);
        } catch (err) {
            console.error(err);
            setSuggestions([
                { Id: 1, Author: 'Admin', Texto: 'Welcome to the suggestion board!', CreatedAt: new Date().toISOString() },
                { Id: 2, Author: 'Guest', Texto: 'I love the retro style.', CreatedAt: new Date().toISOString() }
            ]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!author || !message) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Author: author, Texto: message }),
            });

            if (!response.ok) throw new Error('Failed to post suggestion');
            
            await fetchSuggestions();
            setAuthor('');
            setMessage('');
        } catch (err) {
            setError('Error posting data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.window}>
                <div style={styles.titleBar}>
                    <span>New Suggestion.exe</span>
                    <button style={{...styles.button, padding: '0 4px', minWidth: '20px'}}>X</button>
                </div>
                <div style={styles.content}>
                    <form onSubmit={handleSubmit}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Author:</label>
                        <input
                            type="text"
                            style={styles.input}
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Your Name"
                        />
                        
                        <label style={{ display: 'block', marginBottom: '5px' }}>Message:</label>
                        <textarea
                            style={styles.textarea}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your suggestion here..."
                        />

                        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="submit" style={styles.button} disabled={loading}>
                                        {loading ? 'Sending...' : 'Submit'}
                                </button>
                        </div>
                    </form>
                </div>
            </div>

            <div style={styles.window}>
                <div style={styles.titleBar}>
                    <span>Incoming Suggestions - Notepad</span>
                    <button style={{...styles.button, padding: '0 4px', minWidth: '20px'}}>X</button>
                </div>
                <div style={styles.content}>
                        <div style={{...styles.fieldset, height: '300px', overflowY: 'auto', backgroundColor: 'white' }}>
                                {suggestions.length === 0 ? (
                                        <p>No suggestions yet...</p>
                                ) : (
                                        suggestions.map((s) => (
                                        <div key={s.Id} style={{ marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
                                                <div style={{ fontWeight: 'bold', color: 'navy' }}>&lt;{s.Author}&gt; says:</div>
                                                <div style={{ fontFamily: '"Courier New", monospace' }}>{s.Texto}</div>
                                                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                                                        Sent: {new Date(s.CreatedAt).toLocaleDateString()}
                                                </div>
                                        </div>
                                        ))
                                )}
                        </div>
                        <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                <button onClick={fetchSuggestions} style={styles.button}>Refresh</button>
                        </div>
                </div>
            </div>
        </div>
    );
};

export default Sugest;