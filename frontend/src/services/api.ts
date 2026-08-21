import type {
  EngineStatus,
  BestMoveRequest,
  GameStatusDTO,
  GameAnalysisResponseDTO,
  EngineConfig,
  AiCoachRequest,
  AiCoachResponse,
} from '../types/chess';
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomResponse,
  GameRoom,
  MatchmakingRequest,
  MatchmakingResponse,
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

  analyzeGame(
    moves: string[],
    options?: { sanMoves?: string[]; movetime?: number; elo?: number; depth?: number; fen?: string }
  ): Promise<GameAnalysisResponseDTO> {
    return fetchJson<GameAnalysisResponseDTO>('/api/chess/analyze', {
      method: 'POST',
      body: JSON.stringify({
        moves,
        sanMoves: options?.sanMoves,
        movetime: options?.movetime,
        elo: options?.elo,
        depth: options?.depth,
        fen: options?.fen,
      }),
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

  // Matchmaking REST APIs
  joinMatchmaking(req: MatchmakingRequest): Promise<MatchmakingResponse> {
    return fetchJson<MatchmakingResponse>('/api/multiplayer/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  cancelMatchmaking(playerId: string): Promise<MatchmakingResponse> {
    return fetchJson<MatchmakingResponse>('/api/multiplayer/matchmaking/cancel', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  },

  getMatchmakingStatus(playerId: string): Promise<MatchmakingResponse> {
    return fetchJson<MatchmakingResponse>(`/api/multiplayer/matchmaking/status/${playerId}`);
  },

  // AI Grandmaster Coach REST APIs (Groq LLM)
  getAiCoachCommentary(req: AiCoachRequest): Promise<AiCoachResponse> {
    return fetchJson<AiCoachResponse>('/api/ai/coach/commentary', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getAiCoachStatus(): Promise<{ isGroqConfigured: boolean; model: string; availablePersonas: string[] }> {
    return fetchJson<{ isGroqConfigured: boolean; model: string; availablePersonas: string[] }>('/api/ai/coach/status');
  },
};
