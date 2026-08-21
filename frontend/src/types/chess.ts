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
  pv?: string;
  secondBestMove?: string;
  secondScoreType?: string;
  secondScoreValue?: number;
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

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book'
  | 'miss';

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
  moveIndex: number;
  moveNumber: number;
  playerColor: string;
  move: string;
  piece?: string;
  from?: string;
  to?: string;
  fenBefore?: string;
  fenAfter?: string;
  fen?: string;
  bestMove?: string;
  bestMoveSan?: string;
  secondBestMove?: string;
  secondBestMoveSan?: string;
  ponderMove?: string;
  pv?: string;
  evaluation: string;
  scoreType?: string;
  scoreValue?: number;
  evalCpBefore?: number;
  evalCpAfter?: number;
  winPercentageBefore?: number;
  winPercentageAfter?: number;
  winDrop?: number;
  classification: MoveClassification;
  depth?: number;
}

export interface GameAnalysisResponseDTO {
  evaluations: MoveAnalysisDTO[];
  totalMoves: number;
  whiteAccuracy: number;
  blackAccuracy: number;

  whiteBookCount?: number;
  whiteBrilliantCount?: number;
  whiteGreatCount?: number;
  whiteBestCount?: number;
  whiteExcellentCount?: number;
  whiteGoodCount?: number;
  whiteInaccuracyCount?: number;
  whiteMistakeCount?: number;
  whiteBlunderCount?: number;
  whiteMissCount?: number;

  blackBookCount?: number;
  blackBrilliantCount?: number;
  blackGreatCount?: number;
  blackBestCount?: number;
  blackExcellentCount?: number;
  blackGoodCount?: number;
  blackInaccuracyCount?: number;
  blackMistakeCount?: number;
  blackBlunderCount?: number;
  blackMissCount?: number;
}

export type CoachPersona = 'grandmaster' | 'enthusiastic' | 'tactical';

export interface AiCoachRequest {
  fen: string;
  san: string;
  color: 'w' | 'b';
  moveNumber: number;
  classification: MoveClassification;
  evalCp: number;
  winPercentage: number;
  winDrop: number;
  bestMoveSan?: string;
  pv?: string;
  coachPersona?: CoachPersona;
  customApiKey?: string;
}

export interface AiCoachResponse {
  success: boolean;
  commentary: string;
  tacticalSummary?: string;
  suggestedLine?: string;
  speechScript?: string;
  provider: 'GROQ' | 'HEURISTIC';
  model?: string;
}
