package com.chessengine.service.impl;

import com.chessengine.dto.*;
import com.chessengine.engine.process.StockfishProcessManager;
import com.chessengine.service.ChessService;
import com.chessengine.util.OpeningBook;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class ChessServiceImpl implements ChessService {

    private final StockfishProcessManager engineManager;

    public ChessServiceImpl(StockfishProcessManager engineManager) {
        this.engineManager = engineManager;
    }

    public static double calculateWinPercentage(double centipawns) {
        return 50.0 + 50.0 * (2.0 / (1.0 + Math.exp(-0.00368208 * centipawns)) - 1.0);
    }

    public static double calculateAccuracy(double avgWinDrop) {
        double acc = 103.1668 * Math.exp(-0.04354 * avgWinDrop) - 3.1669;
        return Math.max(0.0, Math.min(100.0, acc));
    }

    private int scoreToCentipawns(String scoreType, Integer scoreValue) {
        if (scoreValue == null) return 0;
        if ("mate".equalsIgnoreCase(scoreType)) {
            if (scoreValue > 0) {
                return 30000 - Math.min(scoreValue, 99) * 100;
            } else {
                return -30000 + Math.min(Math.abs(scoreValue), 99) * 100;
            }
        }
        return scoreValue;
    }

    @Override
    public GameStatusDTO getBestMove(MoveRequestDTO request) {
        return engineManager.calculateBestMove(
                request.getFen(),
                request.getMoves(),
                request.getMovetime(),
                request.getDepth(),
                request.getElo()
        );
    }

    @Override
    public GameAnalysisResponseDTO analyzeGame(AnalyzeRequestDTO request) {
        List<String> moves = request.getMoves();
        if (moves == null || moves.isEmpty()) {
            return GameAnalysisResponseDTO.builder()
                    .evaluations(Collections.emptyList())
                    .totalMoves(0)
                    .whiteAccuracy(100.0)
                    .blackAccuracy(100.0)
                    .build();
        }

        List<MoveAnalysisDTO> evaluations = new ArrayList<>();
        int elo = request.getElo() != null ? request.getElo() : 3200;
        int movetime = request.getMovetime() != null ? request.getMovetime() : 150;

        List<Double> whiteWinDrops = new ArrayList<>();
        List<Double> blackWinDrops = new ArrayList<>();

        int wBook = 0, wBrilliant = 0, wGreat = 0, wBest = 0, wExcellent = 0, wGood = 0, wInacc = 0, wMistake = 0, wBlunder = 0, wMiss = 0;
        int bBook = 0, bBrilliant = 0, bGreat = 0, bBest = 0, bExcellent = 0, bGood = 0, bInacc = 0, bMistake = 0, bBlunder = 0, bMiss = 0;

        double lastOpponentWinDrop = 0.0;

        // Evaluation cache: the position after move i is the same as the position before move i+1.
        // By evaluating that position once (with MultiPV=2) and caching the result, we can reuse it
        // as evalBefore for move i+1 — reducing total engine calls from 2N to roughly N+1.
        GameStatusDTO cachedEvalForNextBefore = null;

        List<String> sanMoves = request.getSanMoves();

        for (int i = 0; i < moves.size(); i++) {
            String playerColor = (i % 2 == 0) ? "white" : "black";
            int moveNum = (i / 2) + 1;
            List<String> movesBefore = moves.subList(0, i);
            List<String> movesAfter = moves.subList(0, i + 1);

            // --- 2. Evaluate position BEFORE move i (active player perspective, MultiPV=2) ---
            // Reuse cached evaluation from the previous iteration when available.
            GameStatusDTO evalBefore;
            if (cachedEvalForNextBefore != null) {
                evalBefore = cachedEvalForNextBefore;
            } else {
                evalBefore = engineManager.calculateBestMove(
                        request.getFen(),
                        new ArrayList<>(movesBefore),
                        movetime,
                        request.getDepth(),
                        elo,
                        2
                );
            }

            // --- 3. Evaluate position AFTER move i (opponent perspective) ---
            // For non-last moves, evaluate with MultiPV=2 so the result can be cached
            // as evalBefore for the next move. For the last move, MultiPV=1 suffices.
            GameStatusDTO evalAfter;
            boolean isLastMove = (i == moves.size() - 1);
            if (!isLastMove) {
                evalAfter = engineManager.calculateBestMove(
                        request.getFen(),
                        new ArrayList<>(movesAfter),
                        movetime,
                        request.getDepth(),
                        elo,
                        2
                );
                cachedEvalForNextBefore = evalAfter;
            } else {
                evalAfter = engineManager.calculateBestMove(
                        request.getFen(),
                        new ArrayList<>(movesAfter),
                        movetime,
                        request.getDepth(),
                        elo,
                        1
                );
                cachedEvalForNextBefore = null;
            }

            // UciProtocolHandler outputs evaluations normalized to White's perspective (+ = White, - = Black)
            int cpBeforeWhite = scoreToCentipawns(evalBefore.getScoreType(), evalBefore.getScoreValue());
            int cpAfterWhite = scoreToCentipawns(evalAfter.getScoreType(), evalAfter.getScoreValue());

            // Compute win percentages relative to the active player
            boolean isWhite = "white".equals(playerColor);
            int playerCpBefore = isWhite ? cpBeforeWhite : -cpBeforeWhite;
            int playerCpAfter = isWhite ? cpAfterWhite : -cpAfterWhite;

            double winPctBefore = calculateWinPercentage(playerCpBefore);
            double winPctAfter = calculateWinPercentage(playerCpAfter);
            double winDrop = Math.max(0.0, winPctBefore - winPctAfter);

            String playedMoveStr = moves.get(i);
            String sanStr = (sanMoves != null && sanMoves.size() > i) ? sanMoves.get(i) : playedMoveStr;
            String bestMoveUci = evalBefore.getBestMove();
            String secondBestMoveUci = evalBefore.getSecondBestMove();

            boolean isExactBestMove = isSameUciMove(playedMoveStr, bestMoveUci);

            // --- MultiPV Gap for "Great Move" (Only good move in position) ---
            boolean isOnlyMove = false;
            if (evalBefore.getSecondScoreValue() != null && evalBefore.getSecondScoreType() != null) {
                int cpSecondWhite = scoreToCentipawns(evalBefore.getSecondScoreType(), evalBefore.getSecondScoreValue());
                int playerCpSecond = isWhite ? cpSecondWhite : -cpSecondWhite;
                double winPctSecond = calculateWinPercentage(playerCpSecond);
                double pvGap = Math.max(0.0, winPctBefore - winPctSecond);

                // If the gap between PV1 and PV2 is >= 12% win expectation (or >= 150 CP), and position was not trivial
                if (pvGap >= 12.0 && winPctBefore < 95.0) {
                    isOnlyMove = true;
                }
            }

            // --- Move classification ---
            String classification;
            boolean isForcedMate = "mate".equalsIgnoreCase(evalBefore.getScoreType()) || "mate".equalsIgnoreCase(evalAfter.getScoreType());
            boolean isAlreadyCrushing = !isForcedMate && (winPctBefore >= 98.0 || playerCpBefore >= 600);
            boolean isTrueSacrifice = !isAlreadyCrushing && isStrictSacrifice(sanStr, playedMoveStr, i, moves, evalBefore, evalAfter, playerCpAfter);

            if (isExactBestMove) {
                if (isTrueSacrifice) {
                    classification = "brilliant";
                } else if (isOnlyMove) {
                    classification = "great";
                } else {
                    classification = "best";
                }
                winDrop = 0.0;
            } else if (winDrop <= 2.0) {
                classification = "excellent";
            } else if (winDrop <= 5.0) {
                classification = "good";
            } else if (winDrop <= 10.0) {
                classification = "inaccuracy";
            } else if (winDrop <= 20.0) {
                classification = "mistake";
            } else {
                // Severe drop (> 20.0% WinDrop):
                // Missed Win / Missed Tactic: Player failed to capitalize on opponent's mistake or threw away a forced mate / winning advantage.
                boolean isMissedWinOrTactic = lastOpponentWinDrop >= 10.0 ||
                                              "mate".equalsIgnoreCase(evalBefore.getScoreType()) ||
                                              playerCpBefore >= 300;
                if (isMissedWinOrTactic) {
                    classification = "miss";
                } else {
                    classification = "blunder";
                }
            }

            lastOpponentWinDrop = winDrop;

            if ("white".equals(playerColor)) {
                whiteWinDrops.add(winDrop);
                switch (classification) {
                    case "brilliant" -> wBrilliant++;
                    case "great" -> wGreat++;
                    case "best" -> wBest++;
                    case "excellent" -> wExcellent++;
                    case "good" -> wGood++;
                    case "inaccuracy" -> wInacc++;
                    case "mistake" -> wMistake++;
                    case "blunder" -> wBlunder++;
                    case "miss" -> wMiss++;
                }
            } else {
                blackWinDrops.add(winDrop);
                switch (classification) {
                    case "brilliant" -> bBrilliant++;
                    case "great" -> bGreat++;
                    case "best" -> bBest++;
                    case "excellent" -> bExcellent++;
                    case "good" -> bGood++;
                    case "inaccuracy" -> bInacc++;
                    case "mistake" -> bMistake++;
                    case "blunder" -> bBlunder++;
                    case "miss" -> bMiss++;
                }
            }

            evaluations.add(MoveAnalysisDTO.builder()
                    .moveIndex(i + 1)
                    .moveNumber(moveNum)
                    .playerColor(playerColor)
                    .move(playedMoveStr)
                    .bestMove(bestMoveUci)
                    .secondBestMove(secondBestMoveUci)
                    .ponderMove(evalBefore.getPonderMove())
                    .pv(evalBefore.getPv())
                    .evaluation(evalAfter.getEvaluation())
                    .scoreType(evalAfter.getScoreType())
                    .scoreValue(cpAfterWhite)
                    .evalCpBefore(cpBeforeWhite)
                    .evalCpAfter(cpAfterWhite)
                    .winPercentageBefore(winPctBefore)
                    .winPercentageAfter(winPctAfter)
                    .winDrop(winDrop)
                    .classification(classification)
                    .depth(evalBefore.getDepth())
                    .build());
        }

        double avgWhiteDrop = whiteWinDrops.isEmpty() ? 0.0 : whiteWinDrops.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double avgBlackDrop = blackWinDrops.isEmpty() ? 0.0 : blackWinDrops.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        double whiteAccuracy = calculateAccuracy(avgWhiteDrop);
        double blackAccuracy = calculateAccuracy(avgBlackDrop);

        return GameAnalysisResponseDTO.builder()
                .evaluations(evaluations)
                .totalMoves(evaluations.size())
                .whiteAccuracy(Math.round(whiteAccuracy * 10.0) / 10.0)
                .blackAccuracy(Math.round(blackAccuracy * 10.0) / 10.0)
                .whiteBookCount(wBook)
                .whiteBrilliantCount(wBrilliant)
                .whiteGreatCount(wGreat)
                .whiteBestCount(wBest)
                .whiteExcellentCount(wExcellent)
                .whiteGoodCount(wGood)
                .whiteInaccuracyCount(wInacc)
                .whiteMistakeCount(wMistake)
                .whiteBlunderCount(wBlunder)
                .whiteMissCount(wMiss)
                .blackBookCount(bBook)
                .blackBrilliantCount(bBrilliant)
                .blackGreatCount(bGreat)
                .blackBestCount(bBest)
                .blackExcellentCount(bExcellent)
                .blackGoodCount(bGood)
                .blackInaccuracyCount(bInacc)
                .blackMistakeCount(bMistake)
                .blackBlunderCount(bBlunder)
                .blackMissCount(bMiss)
                .build();
    }

    @Override
    public void configureEngine(EngineConfigDTO config) {
        int elo = config.getElo() != null ? config.getElo() : 3200;
        int threads = config.getThreads() != null ? config.getThreads() : 1;
        int hashSize = config.getHashSizeMb() != null ? config.getHashSizeMb() : 16;
        engineManager.updateConfig(elo, threads, hashSize);
    }

    @Override
    public boolean isEngineRunning() {
        return engineManager.isAlive();
    }

    /**
     * Strict Brilliant Move (!!) Detector following standard chess sacrifice principles:
     * 1. Never fires in opening book / routine opening development (first 6 full moves / 12 half-moves).
     * 2. Must involve giving up major/minor material or playing a sacrificial invasion (Q, R, B, N).
     * 3. Must retain a winning or forced-mate tactical evaluation without blundering.
     */
    private boolean isStrictSacrifice(String san, String uci, int moveIndex, List<String> moves, GameStatusDTO evalBefore, GameStatusDTO evalAfter, int playerCpAfter) {
        if (moveIndex < 12) return false; // Early game opening development is never brilliant
        if (san == null || san.isEmpty()) return false;

        // 1. Check if this move is just recapturing on the same square where opponent captured on previous turn
        if (moveIndex > 0 && uci != null && uci.length() >= 4 && moves != null && moves.size() > moveIndex - 1) {
            String prevUci = moves.get(moveIndex - 1);
            if (prevUci != null && prevUci.length() >= 4) {
                String myTarget = uci.substring(2, 4);
                String prevTarget = prevUci.substring(2, 4);
                if (myTarget.equals(prevTarget)) {
                    return false; // Equal recapture / trade on the same square is not a sacrifice
                }
            }
        }

        boolean isForcedMate = "mate".equalsIgnoreCase(evalAfter.getScoreType()) || "mate".equalsIgnoreCase(evalBefore.getScoreType());

        // 2. Check if the piece played was actually captured by the opponent on the very next ply (True Piece Sacrifice)
        // e.g. 24. Nxf6+ followed by 24... gxf6 (Knight sacrificed on f6), 29. Rxf6+ followed by 29... Qxf6 (Rook sacrificed on f6)
        if (uci != null && uci.length() >= 4 && moves != null && moveIndex + 1 < moves.size()) {
            String nextUci = moves.get(moveIndex + 1);
            if (nextUci != null && nextUci.length() >= 4) {
                String myTarget = uci.substring(2, 4);
                String nextTarget = nextUci.substring(2, 4);
                if (myTarget.equals(nextTarget)) {
                    // The opponent captured our piece on this target square on their next turn!
                    // If it was a Major/Minor piece and we are winning, this was a genuine sacrifice!
                    if (san.startsWith("N") || san.startsWith("B") || san.startsWith("R") || san.startsWith("Q")) {
                        return isForcedMate || playerCpAfter >= 150;
                    }
                }
            }
        }

        // 3. Queen sacrifice into an undefended piece or square (Qx, Qxe5, Qxf6, etc.)
        if (san.startsWith("Qxe") || san.startsWith("Qxf") || san.startsWith("Qxg") || san.startsWith("Qxd") || san.startsWith("Qxc")) {
            return isForcedMate || playerCpAfter >= 150;
        }

        // 4. Exchange sacrifice: Rook takes pawn/minor piece with check or mate (Rxf6+, Rxg7+, Rxh7+)
        if ((san.startsWith("Rxf") || san.startsWith("Rxg") || san.startsWith("Rxh")) && (isForcedMate || (playerCpAfter >= 200 && san.contains("+")))) {
            return true;
        }

        // 5. Minor piece sacrifice with check (Nxf6+, Bxf7+, Bxh7+)
        if ((san.startsWith("Nxf") || san.startsWith("Bxf") || san.startsWith("Bxh")) && (san.contains("+") || isForcedMate || playerCpAfter >= 250)) {
            return true;
        }

        return false;
    }

    private boolean isSameUciMove(String move1, String move2) {
        if (move1 == null || move2 == null) return false;
        String m1 = move1.trim().toLowerCase();
        String m2 = move2.trim().toLowerCase();
        if (m1.equals(m2)) return true;
        // Handle promotion notation (e.g. e7e8q vs e7e8)
        if (m1.length() == 4 && m2.length() == 5 && m2.startsWith(m1)) return true;
        if (m2.length() == 4 && m1.length() == 5 && m1.startsWith(m2)) return true;
        return false;
    }
}


