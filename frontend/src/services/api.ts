import type {
  EngineStatus,
  BestMoveRequest,
  GameStatusDTO,
  GameAnalysisResponseDTO,
  EngineConfig,
} from '../types/chess';
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomResponse,
  GameRoom,
} from '../types/multiplayer';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Network error');
    throw new Error(errorText || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Engine REST APIs
  getEngineStatus(): Promise<EngineStatus> {
    return fetchJson<EngineStatus>('/api/chess/status');
  },

  getBestMove(req: BestMoveRequest): Promise<GameStatusDTO> {
    return fetchJson<GameStatusDTO>('/api/chess/best-move', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  analyzeGame(moves: string[], fenList?: string[]): Promise<GameAnalysisResponseDTO> {
    return fetchJson<GameAnalysisResponseDTO>('/api/chess/analyze', {
      method: 'POST',
      body: JSON.stringify({ moves, fenList }),
    });
  },

  configureEngine(config: EngineConfig): Promise<{ status: string; message: string }> {
    return fetchJson<{ status: string; message: string }>('/api/chess/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // Multiplayer REST APIs
  createRoom(req: CreateRoomRequest): Promise<RoomResponse> {
    return fetchJson<RoomResponse>('/api/multiplayer/create', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  joinRoom(req: JoinRoomRequest): Promise<RoomResponse> {
    return fetchJson<RoomResponse>('/api/multiplayer/join', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getRoom(roomId: string): Promise<GameRoom> {
    return fetchJson<GameRoom>(`/api/multiplayer/room/${roomId}`);
  },

  leaveRoom(roomId: string, playerId: string): void {
    const payload = JSON.stringify({ roomId, playerId });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${BASE_URL}/api/multiplayer/leave`, blob);
    } else {
      fetch(`${BASE_URL}/api/multiplayer/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  },
};
