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
            List<String> movesAfter = moves.subList(0, i + 1);
            List<String> sanAfter = (sanMoves != null && sanMoves.size() >= i + 1) ? sanMoves.subList(0, i + 1) : movesAfter;

            // --- 1. Book move check: skip engine calls entirely for known opening theory ---
            boolean isBook = OpeningBook.isBookMove(sanAfter);
            if (isBook) {
                cachedEvalForNextBefore = null; // Invalidate cache — no eval computed
                evaluations.add(MoveAnalysisDTO.builder()
                        .moveIndex(i + 1)
                        .moveNumber(moveNum)
                        .playerColor(playerColor)
                        .move(moves.get(i))
                        .evaluation("+0.20")
                        .scoreType("cp")
                        .scoreValue(20)
                        .evalCpBefore(20)
                        .evalCpAfter(20)
                        .winPercentageBefore(52.5)
                        .winPercentageAfter(52.5)
                        .classification("book")
                        .winDrop(0.0)
                        .build());
                if ("white".equals(playerColor)) {
                    whiteWinDrops.add(0.0);
                    wBook++;
                } else {
                    blackWinDrops.add(0.0);
                    bBook++;
                }
                continue;
            }

            List<String> movesBefore = moves.subList(0, i);

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
            String bestMoveUci = evalBefore.getBestMove();
            String secondBestMoveUci = evalBefore.getSecondBestMove();

            boolean isBestMove = bestMoveUci != null && (playedMoveStr.equalsIgnoreCase(bestMoveUci) || bestMoveUci.contains(playedMoveStr));

            // --- Move classification ---
            String classification;
            boolean isSacrifice = playedMoveStr.contains("x") || playedMoveStr.startsWith("Q") || playedMoveStr.startsWith("R");

            if (isBestMove) {
                if (isSacrifice && winDrop <= 5.0) {
                    classification = "brilliant";
                } else if (winPctBefore < 95.0 && (i < 6 || playerCpBefore > 300)) {
                    classification = "great";
                } else {
                    classification = "best";
                }
                winDrop = 0.0;
            } else {
                if (winDrop <= 2.0) {
                    classification = "excellent";
                } else if (winDrop <= 5.0) {
                    classification = "good";
                } else if (winDrop <= 12.0) {
                    classification = "inaccuracy";
                } else if (winDrop <= 25.0) {
                    classification = "mistake";
                } else {
                    if (winPctBefore >= 65.0 || lastOpponentWinDrop >= 20.0) {
                        classification = "miss";
                    } else {
                        classification = "blunder";
                    }
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
}
