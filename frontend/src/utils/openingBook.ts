// Frontend opening book dictionary (SAN sequences up to 16 ply)
const BOOK_SEQUENCES = new Set<string>([
  // 1. e4 Openings
  'e4', 'e4 e5', 'e4 e5 Nf3', 'e4 e5 Nf3 Nc6', 'e4 e5 Nf3 Nc6 Bc4', 'e4 e5 Nf3 Nc6 Bc4 Bc5', // Italian Game
  'e4 e5 Nf3 Nc6 Bc4 Nf6', // Two Knights Defense
  'e4 e5 Nf3 Nc6 Bb5', 'e4 e5 Nf3 Nc6 Bb5 a6', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6', // Ruy Lopez
  'e4 e5 Nf3 Nc6 d4', 'e4 e5 Nf3 Nc6 d4 exd4', 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4', // Scotch Game
  'e4 e5 f4', 'e4 e5 f4 exf4', // King's Gambit
  'e4 c5', 'e4 c5 Nf3', 'e4 c5 Nf3 d6', 'e4 c5 Nf3 d6 d4', 'e4 c5 Nf3 d6 d4 cxd4', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4', // Sicilian Defense
  'e4 c5 Nf3 Nc6', 'e4 c5 Nf3 e6', 'e4 c5 Nc3', // Sicilian Variations
  'e4 e6', 'e4 e6 d4', 'e4 e6 d4 d5', 'e4 e6 d4 d5 Nc3', 'e4 e6 d4 d5 Nd2', 'e4 e6 d4 d5 e5', // French Defense
  'e4 c6', 'e4 c6 d4', 'e4 c6 d4 d5', 'e4 c6 d4 d5 Nc3', 'e4 c6 d4 d5 exd5', // Caro-Kann
  'e4 d5', 'e4 d5 exd5', 'e4 d5 exd5 Qxd5', // Scandinavian
  'e4 d6', 'e4 d6 d4', 'e4 d6 d4 Nf6', 'e4 d6 d4 Nf6 Nc3', // Pirc Defense
  'e4 Nf6', 'e4 Nf6 e5', 'e4 Nf6 e5 Nd5', // Alekhine Defense
  'e4 g6', 'e4 g6 d4', 'e4 g6 d4 Bg7', // Modern Defense

  // 1. d4 Openings
  'd4', 'd4 d5', 'd4 d5 c4', 'd4 d5 c4 e6', 'd4 d5 c4 e6 Nc3', 'd4 d5 c4 e6 Nc3 Nf6', // Queen's Gambit Declined
  'd4 d5 c4 c6', 'd4 d5 c4 c6 Nf3', 'd4 d5 c4 c6 Nf3 Nf6', // Slav Defense
  'd4 d5 c4 dxc4', // Queen's Gambit Accepted
  'd4 Nf6', 'd4 Nf6 c4', 'd4 Nf6 c4 g6', 'd4 Nf6 c4 g6 Nc3', 'd4 Nf6 c4 g6 Nc3 Bg7', 'd4 Nf6 c4 g6 Nc3 Bg7 e4', // King's Indian
  'd4 Nf6 c4 e6', 'd4 Nf6 c4 e6 Nc3 Bb4', // Nimzo-Indian
  'd4 Nf6 c4 e6 Nf3 b6', // Queen's Indian
  'd4 Nf6 c4 c5', 'd4 Nf6 c4 c5 d5', // Benoni Defense
  'd4 Nf6 c4 g6 Nc3 d5', // Grunfeld Defense
  'd4 f5', 'd4 f5 c4', 'd4 f5 Nf3', // Dutch Defense
  'd4 Nf6 Nf3', 'd4 Nf6 Bf4', 'd4 d5 Bf4', // London System

  // Flank Openings
  'c4', 'c4 e5', 'c4 c5', 'c4 Nf6', 'c4 e6', // English Opening
  'Nf3', 'Nf3 d5', 'Nf3 d5 g3', 'Nf3 d5 c4', // Reti Opening
  'b3', 'f4', 'g3'
]);

export function isBookMove(moveHistorySan: string[]): boolean {
  if (!moveHistorySan || moveHistorySan.length === 0) return false;
  if (moveHistorySan.length > 16) return false;
  const sequence = moveHistorySan.join(' ').trim();
  return BOOK_SEQUENCES.has(sequence);
}
