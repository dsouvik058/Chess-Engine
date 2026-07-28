export type GameMode = 'VS_AI' | 'MULTIPLAYER' | 'PASS_AND_PLAY';
export type PlayerColor = 'white' | 'black';
export type BoardTheme = 'classic' | 'wood' | 'cyber' | 'emerald';

export interface EngineStatus {
  running: boolean;
  engine: string;
  maxElo: number;
}

export interface BestMoveRequest {
  fen: string;
  depth?: number;
  maxTimeMs?: number;
  skillLevel?: number;
  elo?: number;
}

export interface GameStatusDTO {
  bestMove: string;
  ponderMove?: string;
  evaluation: string;
  scoreType: 'cp' | 'mate';
  scoreValue: number;
  depth: number;
  nodes: number;
  nps: number;
  timeMs: number;
}

export interface EngineConfig {
  elo?: number;
  threads?: number;
  hashMb?: number;
}

export type MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';

export interface MoveLogItem {
  moveNumber: number;
  white?: string;
  whiteFen?: string;
  whiteBadge?: MoveClassification;
  black?: string;
  blackFen?: string;
  blackBadge?: MoveClassification;
}

export interface MoveAnalysisDTO {
  moveNumber: number;
  playerColor: string;
  san: string;
  fenBefore: string;
  fenAfter: string;
  evalCpBefore: number;
  evalCpAfter: number;
  evalChange: number;
  classification: MoveClassification;
  bestMoveSan?: string;
}

export interface GameAnalysisResponseDTO {
  moves: MoveAnalysisDTO[];
  whiteAccuracyPercent: number;
  blackAccuracyPercent: number;
  whiteBestCount: number;
  whiteInaccuracyCount: number;
  whiteMistakeCount: number;
  whiteBlunderCount: number;
  blackBestCount: number;
  blackInaccuracyCount: number;
  blackMistakeCount: number;
  blackBlunderCount: number;
}
