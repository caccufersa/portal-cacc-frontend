'use client';

import { useState } from 'react';
import { useWebSocket, type WSMessage } from '@/lib/websocket';
import { useWebSocketContext } from '@/context/WebSocketContext';

export function WsStatusIndicator() {
    const { status } = useWebSocketContext();

    const label: Record<string, string> = {
        connected: '🟢 Conectado',
        connecting: '🟡 Conectando…',
        offline: '🔴 Offline',
    };

    return <span title={`WebSocket: ${status}`}>{label[status]}</span>;
}

export function LiveNewsFeed() {
    const [headlines, setHeadlines] = useState<string[]>([]);

    const { status } = useWebSocket('new_noticia', (msg: WSMessage) => {
        const title =
            typeof msg.data === 'object' && msg.data !== null && 'title' in msg.data
                ? String((msg.data as Record<string, unknown>).title)
                : JSON.stringify(msg.data);
        setHeadlines((prev) => [title, ...prev].slice(0, 20));
    });

    return (
        <div>
            <h3>📰 Notícias ao vivo ({status})</h3>
            <ul>
                {headlines.map((h, i) => (
                    <li key={i}>{h}</li>
                ))}
            </ul>
        </div>
    );
}


export function WsDebugger() {
    const [events, setEvents] = useState<WSMessage[]>([]);

    useWebSocket('*', (msg) => {
        setEvents((prev) => [msg, ...prev].slice(0, 50));
    });

    return (
        <details>
            <summary>🐛 WS Debug ({events.length} eventos)</summary>
            <pre style={{ maxHeight: 300, overflow: 'auto', fontSize: 11 }}>
                {JSON.stringify(events, null, 2)}
            </pre>
        </details>
    );
}
