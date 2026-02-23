
//  WebSocketService – testes unitários


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '@/lib/websocket/WebSocketService';
import type { WSMessage } from '@/lib/websocket/types';

//  Mock do WebSocket nativo  

type WSListener = (ev: unknown) => void;

class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    url: string;

    onopen: WSListener | null = null;
    onclose: WSListener | null = null;
    onerror: WSListener | null = null;
    onmessage: WSListener | null = null;

    sent: string[] = [];

    constructor(url: string) {
        this.url = url;
        MockWebSocket.instances.push(this);
    }

    send(data: string) {
        this.sent.push(data);
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;
        // onclose é chamado explicitamente nos testes quando necessário
    }

    simulateOpen() {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.({});
    }

    simulateMessage(data: unknown) {
        this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
    }

    simulateClose(code = 1000, reason = '') {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code, reason } as CloseEvent);
    }

    simulateError() {
        this.onerror?.({});
    }

    static instances: MockWebSocket[] = [];
    static reset() { MockWebSocket.instances = []; }
    static last(): MockWebSocket | undefined {
        return MockWebSocket.instances[MockWebSocket.instances.length - 1];
    }
}

beforeEach(() => {
    MockWebSocket.reset();
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof globalThis.WebSocket);
    vi.useFakeTimers();
});

afterEach(() => {
    WebSocketService.resetInstance();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('WebSocketService – conexão', () => {
    it('conecta e muda status para "connected"', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const statuses: string[] = [];
        svc.onStatusChange((s) => statuses.push(s));

        svc.connect('my-jwt');

        const ws = MockWebSocket.last()!;
        expect(ws).toBeDefined();
        expect(ws.url).toContain('ws://test/ws?token=my-jwt');
        expect(statuses).toContain('connecting');

        ws.simulateOpen();
        expect(svc.status).toBe('connected');
        expect(statuses).toContain('connected');
    });

    it('não conecta sem JWT', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        svc.connect('');
        expect(MockWebSocket.instances).toHaveLength(0);
    });

    it('disconnect muda status para "offline"', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        svc.connect('jwt');
        MockWebSocket.last()!.simulateOpen();
        expect(svc.status).toBe('connected');

        svc.disconnect();
        expect(svc.status).toBe('offline');
    });
});


describe('WebSocketService – dispatch de eventos', () => {
    it('despacha mensagem para handler inscrito pelo type', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const received: WSMessage[] = [];

        svc.subscribe('new_post', (msg) => received.push(msg));
        svc.connect('jwt');
        MockWebSocket.last()!.simulateOpen();

        const msg: WSMessage = { type: 'new_post', data: { id: 1, text: 'Olá' } };
        MockWebSocket.last()!.simulateMessage(msg);

        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('new_post');
        expect((received[0].data as Record<string, unknown>).id).toBe(1);
    });

    it('não despacha para handler de outro type', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const received: WSMessage[] = [];

        svc.subscribe('new_noticia', (msg) => received.push(msg));
        svc.connect('jwt');
        MockWebSocket.last()!.simulateOpen();

        MockWebSocket.last()!.simulateMessage({ type: 'new_post', data: {} });
        expect(received).toHaveLength(0);
    });

    it('wildcard (*) recebe todos os tipos', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const received: WSMessage[] = [];

        svc.subscribe('*', (msg) => received.push(msg));
        svc.connect('jwt');
        MockWebSocket.last()!.simulateOpen();

        MockWebSocket.last()!.simulateMessage({ type: 'new_post', data: {} });
        MockWebSocket.last()!.simulateMessage({ type: 'user_login', data: {} });
        expect(received).toHaveLength(2);
    });

    it('unsubscribe remove o handler', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const received: WSMessage[] = [];

        const unsub = svc.subscribe('new_post', (msg) => received.push(msg));
        svc.connect('jwt');
        MockWebSocket.last()!.simulateOpen();

        MockWebSocket.last()!.simulateMessage({ type: 'new_post', data: { n: 1 } });
        expect(received).toHaveLength(1);

        unsub();

        MockWebSocket.last()!.simulateMessage({ type: 'new_post', data: { n: 2 } });
        expect(received).toHaveLength(1); // não cresceu
    });

    it('ignora JSON malformado', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const received: WSMessage[] = [];
        svc.subscribe('*', (msg) => received.push(msg));

        svc.connect('jwt');
        const ws = MockWebSocket.last()!;
        ws.simulateOpen();

        // envia lixo direto no onmessage
        ws.onmessage?.({ data: 'not-json{{{' } as MessageEvent);
        expect(received).toHaveLength(0);
    });
});

describe('WebSocketService – send', () => {
    it('envia JSON quando conectado', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        svc.connect('jwt');
        const ws = MockWebSocket.last()!;
        ws.simulateOpen();

        svc.send({ type: 'ping' });
        expect(ws.sent).toHaveLength(1);
        expect(JSON.parse(ws.sent[0])).toEqual({ type: 'ping' });
    });

    it('descarta send() quando offline', () => {
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        svc.send({ type: 'ping' }); // sem conexão
        // não deve lançar erro
        expect(MockWebSocket.instances).toHaveLength(0);
    });
});

describe('WebSocketService – reconexão', () => {
    it('reconecta automaticamente após close não-intencional', () => {
        const svc = WebSocketService.getInstance({
            url: 'ws://test/ws',
            backoffMs: [100, 200],
        });
        svc.connect('jwt');

        const ws1 = MockWebSocket.last()!;
        ws1.simulateOpen();
        expect(svc.status).toBe('connected');

        // servidor fecha inesperadamente
        ws1.simulateClose(1006);
        expect(svc.status).toBe('connecting');

        // avança o primeiro backoff (100ms)
        vi.advanceTimersByTime(100);
        const ws2 = MockWebSocket.last()!;
        expect(ws2).not.toBe(ws1);
        ws2.simulateOpen();
        expect(svc.status).toBe('connected');
    });

    it('backoff cresce a cada tentativa de falha consecutiva', () => {
        const svc = WebSocketService.getInstance({
            url: 'ws://test/ws',
            backoffMs: [100, 500, 2000],
        });
        svc.connect('jwt');

        MockWebSocket.last()!.simulateOpen();
        MockWebSocket.last()!.simulateClose(1006);
        // reconnectAttempt = 0 → backoff[0] = 100ms

        const countAfterFirst = MockWebSocket.instances.length;

        // Avança 99ms – não deve ter reconectado ainda
        vi.advanceTimersByTime(99);
        expect(MockWebSocket.instances.length).toBe(countAfterFirst);

        // Avança mais 1ms (total = 100ms) – reconecta
        vi.advanceTimersByTime(1);
        expect(MockWebSocket.instances.length).toBe(countAfterFirst + 1);

        // Segunda tentativa falha IMEDIATAMENTE (sem abrir = sem resetar attempt)
        MockWebSocket.last()!.simulateClose(1006);
        // reconnectAttempt = 1 → backoff[1] = 500ms

        const countAfterSecond = MockWebSocket.instances.length;

        // Avança 400ms – não deve reconectar (backoff[1] = 500)
        vi.advanceTimersByTime(400);
        expect(MockWebSocket.instances.length).toBe(countAfterSecond);

        // Avança mais 100ms (total = 500ms) – reconecta
        vi.advanceTimersByTime(100);
        expect(MockWebSocket.instances.length).toBe(countAfterSecond + 1);
    });

    it('NÃO reconecta após disconnect() intencional', () => {
        const svc = WebSocketService.getInstance({
            url: 'ws://test/ws',
            backoffMs: [100],
        });
        svc.connect('jwt');
        MockWebSocket.last()!.simulateOpen();

        const countBefore = MockWebSocket.instances.length;
        svc.disconnect();

        vi.advanceTimersByTime(10_000);
        expect(MockWebSocket.instances.length).toBe(countBefore);
    });
});

//  5. Token expirado / erro de auth


describe('WebSocketService – token expirado', () => {
    it('chama onAuthError e NÃO reconecta no code 4001', () => {
        const onAuthError = vi.fn();
        const svc = WebSocketService.getInstance({
            url: 'ws://test/ws',
            backoffMs: [100],
        });
        svc.updateOptions({ onAuthError });
        svc.connect('expired-jwt');

        MockWebSocket.last()!.simulateOpen();
        MockWebSocket.last()!.simulateClose(4001, 'token expired');

        expect(onAuthError).toHaveBeenCalledOnce();
        expect(svc.status).toBe('offline');

        // garante que NÃO tenta reconectar
        const count = MockWebSocket.instances.length;
        vi.advanceTimersByTime(10_000);
        expect(MockWebSocket.instances.length).toBe(count);
    });

    it('chama onAuthError no code 4003', () => {
        const onAuthError = vi.fn();
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        svc.updateOptions({ onAuthError });
        svc.connect('bad-jwt');

        MockWebSocket.last()!.simulateOpen();
        MockWebSocket.last()!.simulateClose(4003, 'forbidden');

        expect(onAuthError).toHaveBeenCalledOnce();
    });

    it('chama onAuthError no code 1008 (policy violation)', () => {
        const onAuthError = vi.fn();
        const svc = WebSocketService.getInstance({ url: 'ws://test/ws' });
        svc.updateOptions({ onAuthError });
        svc.connect('bad-jwt');

        MockWebSocket.last()!.simulateOpen();
        MockWebSocket.last()!.simulateClose(1008);

        expect(onAuthError).toHaveBeenCalledOnce();
    });
});

// Heartbeat

describe('WebSocketService – heartbeat', () => {
    it('envia ping no intervalo configurado', () => {
        const svc = WebSocketService.getInstance({
            url: 'ws://test/ws',
            heartbeatIntervalMs: 500,
        });
        svc.connect('jwt');
        const ws = MockWebSocket.last()!;
        ws.simulateOpen();

        expect(ws.sent).toHaveLength(0);

        vi.advanceTimersByTime(500);
        expect(ws.sent).toHaveLength(1);
        expect(JSON.parse(ws.sent[0])).toEqual({ type: 'ping' });

        vi.advanceTimersByTime(500);
        expect(ws.sent).toHaveLength(2);
    });

    it('para o heartbeat após disconnect', () => {
        const svc = WebSocketService.getInstance({
            url: 'ws://test/ws',
            heartbeatIntervalMs: 500,
        });
        svc.connect('jwt');
        const ws = MockWebSocket.last()!;
        ws.simulateOpen();

        svc.disconnect();
        vi.advanceTimersByTime(5_000);
        expect(ws.sent).toHaveLength(0);
    });
});

// Singleton

describe('WebSocketService – singleton', () => {
    it('retorna a mesma instância', () => {
        const a = WebSocketService.getInstance({ url: 'ws://test/ws' });
        const b = WebSocketService.getInstance();
        expect(a).toBe(b);
    });

    it('resetInstance cria nova instância', () => {
        const a = WebSocketService.getInstance({ url: 'ws://test/ws' });
        WebSocketService.resetInstance();
        const b = WebSocketService.getInstance({ url: 'ws://test2/ws' });
        expect(a).not.toBe(b);
    });
});
