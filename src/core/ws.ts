import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

export interface WebSocketClient {
    socket: WebSocket;
    subscriptions: Set<string>;
    uid: string;
}

export interface WSRequest {
    action: string;
    payload: Record<string, any>;
}

export abstract class WS {
    protected static connectedSockets: Map<string, WebSocketClient> = new Map();

    constructor(server: any, path: string) {
        const wss = new WebSocketServer({ server, path });

        wss.on('connection', (socket: WebSocket, req: IncomingMessage) => {
            const uid = this.getUID(req);

            if (!uid) {
                socket.close(1008, 'Unauthorized');
                return;
            }

            WS.connectedSockets.set(uid, {
                socket,
                subscriptions: new Set(),
                uid,
            });

            socket.on('message', (msg) => this.handleMessage(uid, msg.toString()));
            socket.on('close', () => {
                WS.connectedSockets.delete(uid);
            });
        });
    }

    private handleMessage(uid: string, msg: string): void {
        try {
            const { action, payload } = JSON.parse(msg) as WSRequest;

            if (action === 'subscribe') {
                const key = `${payload.type}:${payload.id}`;
                WS.connectedSockets.get(uid)?.subscriptions.add(key);
                this.send(uid, { success: true, action });
            } else {
                this.onMessage(uid, action, payload);
            }
        } catch (e: any) {
            this.send(uid, { success: false, error: e.message });
        }
    }

    protected abstract onMessage(uid: string, action: string, payload: Record<string, any>): void;

    protected getUID(req: IncomingMessage): string {
        // Exemple simple avec un header X-UID
        return (req.headers['x-uid'] as string) || '';
    }

    protected send(uid: string, data: any): void {
        const client = WS.connectedSockets.get(uid);
        if (client?.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify(data));
        }
    }

    static emitToSubscribers(type: string, id: string, message: any): void {
        const key = `${type}:${id}`;
        for (const { socket, subscriptions } of WS.connectedSockets.values()) {
            if (socket.readyState === WebSocket.OPEN && subscriptions.has(key)) {
                socket.send(JSON.stringify(message));
            }
        }
    }

    static emitToAll(message: any): void {
        for (const { socket } of WS.connectedSockets.values()) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(message));
            }
        }
    }
}
