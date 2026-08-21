export interface GameRoom {
  roomId: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  currentFen: string;
  hostPlayerId?: string;
  guestPlayerId?: string;
  whitePlayerId?: string;
  blackPlayerId?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
  timeControlMinutes: number;
  winnerColor?: string;
  finishReason?: string;
  moveHistory: string[];
}

export interface CreateRoomRequest {
  playerName?: string;
  preferredColor?: string;
  timeControlMinutes?: number;
}

export interface JoinRoomRequest {
  roomId: string;
  playerName?: string;
  playerId?: string;
}

export interface RoomResponse {
  room: GameRoom;
  playerId: string;
  playerColor: 'white' | 'black';
  role: 'HOST' | 'GUEST';
}

export interface MultiplayerMove {
  roomId: string;
  playerId: string;
  from: string;
  to: string;
  promotion?: string;
  san: string;
  fen?: string;
  whiteTimeMs?: number;
  blackTimeMs?: number;
  isCheckmate?: boolean;
  isDraw?: boolean;
}

export interface ChatMessage {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp?: string | number;
}

export interface MatchmakingRequest {
  playerId?: string;
  playerName?: string;
  elo?: number;
  timeControlMinutes?: number;
  incrementSeconds?: number;
  category?: string;
  preferredColor?: 'white' | 'black' | 'random';
}

export interface MatchmakingResponse {
  status: 'QUEUED' | 'MATCHED' | 'CANCELLED' | 'NOT_FOUND' | 'TIMEOUT';
  roomId?: string;
  playerId?: string;
  playerColor?: 'white' | 'black';
  opponentName?: string;
  opponentElo?: number;
  timeControlMinutes?: number;
  incrementSeconds?: number;
  room?: GameRoom;
}
