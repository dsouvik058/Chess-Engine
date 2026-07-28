import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import type { MultiplayerMove, ChatMessage } from '../types/multiplayer';

export interface TakebackPayload {
  roomId: string;
  requesterId: string;
  accepted?: boolean;
}

export class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private currentRoomSub: StompSubscription | null = null;
  private currentChatSub: StompSubscription | null = null;

  public connect(
    onConnected?: () => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client && this.isConnected) {
        if (onConnected) onConnected();
        resolve();
        return;
      }

      const socketUrl = (import.meta.env.VITE_API_URL || '') + '/ws-chess';

      this.client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        debug: (str) => {
          if (import.meta.env.DEV) {
            console.log('[STOMP]', str);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = () => {
        this.isConnected = true;
        if (onConnected) onConnected();
        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error('[STOMP Error]', frame.headers['message'], frame.body);
        this.isConnected = false;
        if (onError) onError(frame);
        reject(frame);
      };

      this.client.activate();
    });
  }

  public registerPlayerSession(roomId: string, playerId: string) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${roomId}/register`,
      body: JSON.stringify({ roomId, playerId }),
    });
  }

  public subscribeToRoom(
    roomId: string,
    onRoomUpdate: (data: any) => void
  ) {
    if (!this.client || !this.isConnected) return null;

    if (this.currentRoomSub) {
      try {
        this.currentRoomSub.unsubscribe();
      } catch (e) {
        console.warn('Failed to unsubscribe previous room sub:', e);
      }
      this.currentRoomSub = null;
    }

    this.currentRoomSub = this.client.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        console.log(`[STOMP /topic/room/${roomId}]`, payload);
        onRoomUpdate(payload);
      } catch (e) {
        console.error('Failed to parse room message:', e);
      }
    });

    return this.currentRoomSub;
  }

  public subscribeToChat(
    roomId: string,
    onChatMessage: (chat: ChatMessage) => void
  ) {
    if (!this.client || !this.isConnected) return null;

    if (this.currentChatSub) {
      try {
        this.currentChatSub.unsubscribe();
      } catch (e) {
        console.warn('Failed to unsubscribe previous chat sub:', e);
      }
      this.currentChatSub = null;
    }

    this.currentChatSub = this.client.subscribe(`/topic/room/${roomId}/chat`, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        onChatMessage(payload);
      } catch (e) {
        console.error('Failed to parse chat message:', e);
      }
    });

    return this.currentChatSub;
  }

  public sendMove(move: MultiplayerMove) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${move.roomId}/move`,
      body: JSON.stringify(move),
    });
  }

  public sendResign(roomId: string, playerId: string) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${roomId}/resign`,
      body: playerId,
    });
  }

  public sendLeaveRoom(roomId: string, playerId: string) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${roomId}/leave`,
      body: playerId,
    });
  }

  public sendChat(chat: ChatMessage) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${chat.roomId}/chat`,
      body: JSON.stringify(chat),
    });
  }

  public sendTakebackRequest(payload: TakebackPayload) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${payload.roomId}/takeback-request`,
      body: JSON.stringify(payload),
    });
  }

  public sendTakebackResponse(payload: TakebackPayload) {
    if (!this.client || !this.isConnected) return;
    this.client.publish({
      destination: `/app/room/${payload.roomId}/takeback-response`,
      body: JSON.stringify(payload),
    });
  }

  public disconnect() {
    if (this.currentRoomSub) {
      try { this.currentRoomSub.unsubscribe(); } catch (e) {}
      this.currentRoomSub = null;
    }
    if (this.currentChatSub) {
      try { this.currentChatSub.unsubscribe(); } catch (e) {}
      this.currentChatSub = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const wsService = new WebSocketService();
