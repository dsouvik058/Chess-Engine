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
                return 10000 - Math.min(scoreValue, 99) * 100;
            } else {
                return -10000 + Math.min(Math.abs(scoreValue), 99) * 100;
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

        for (int i = 0; i < moves.size(); i++) {
            String playerColor = (i % 2 == 0) ? "white" : "black";
            int moveNum = (i / 2) + 1;
            List<String> movesBefore = moves.subList(0, i);
            List<String> movesAfter = moves.subList(0, i + 1);

            // 1. Evaluate position BEFORE move i (active player perspective, MultiPV = 2)
            GameStatusDTO evalBefore = engineManager.calculateBestMove(
                    request.getFen(),
                    new ArrayList<>(movesBefore),
                    movetime,
                    request.getDepth(),
                    elo,
                    2
            );

            // 2. Evaluate position AFTER move i (opponent perspective, MultiPV = 1)
            GameStatusDTO evalAfter = engineManager.calculateBestMove(
                    request.getFen(),
                    new ArrayList<>(movesAfter),
                    movetime,
                    request.getDepth(),
                    elo,
                    1
            );

            int cpBefore = scoreToCentipawns(evalBefore.getScoreType(), evalBefore.getScoreValue());
            int cpAfterOpponent = scoreToCentipawns(evalAfter.getScoreType(), evalAfter.getScoreValue());
            int cpAfterPlayer = -cpAfterOpponent;

            double winPctBefore = calculateWinPercentage(cpBefore);
            double winPctAfter = calculateWinPercentage(cpAfterPlayer);
            double winDrop = Math.max(0.0, winPctBefore - winPctAfter);

            double winPct2ndBest = winPctBefore;
            if (evalBefore.getSecondScoreValue() != null) {
                int cp2nd = scoreToCentipawns(evalBefore.getSecondScoreType(), evalBefore.getSecondScoreValue());
                winPct2ndBest = calculateWinPercentage(cp2nd);
            }
            double winDrop2ndBest = Math.max(0.0, winPctBefore - winPct2ndBest);

            String playedMoveStr = moves.get(i);
            String bestMoveUci = evalBefore.getBestMove();
            String secondBestMoveUci = evalBefore.getSecondBestMove();

            boolean isBestMove = bestMoveUci != null && (playedMoveStr.equalsIgnoreCase(bestMoveUci) || bestMoveUci.contains(playedMoveStr));

            String classification;
            boolean isBook = OpeningBook.isBookMove(movesAfter);

            if (isBook) {
                classification = "book";
                winDrop = 0.0;
            } else {
                boolean isSacrifice = playedMoveStr.contains("x") || playedMoveStr.startsWith("Q") || playedMoveStr.startsWith("R");
                
                if (isSacrifice && winDrop <= 2.0 && winPctBefore < 95.0) {
                    classification = "brilliant";
                } else if (isBestMove && winDrop2ndBest >= 10.0 && winPctBefore < 95.0) {
                    classification = "great";
                } else if (winDrop >= 10.0 && (winPctBefore >= 60.0 || lastOpponentWinDrop >= 15.0)) {
                    classification = "miss";
                } else if (winDrop <= 0.0001 || (isBestMove && winDrop <= 0.5)) {
                    classification = "best";
                } else if (winDrop <= 2.0) {
                    classification = "excellent";
                } else if (winDrop <= 5.0) {
                    classification = "good";
                } else if (winDrop <= 10.0) {
                    classification = "inaccuracy";
                } else if (winDrop <= 20.0) {
                    classification = "mistake";
                } else {
                    classification = "blunder";
                }
            }

            lastOpponentWinDrop = winDrop;

            if ("white".equals(playerColor)) {
                whiteWinDrops.add(winDrop);
                switch (classification) {
                    case "book" -> wBook++;
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
                    case "book" -> bBook++;
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
                    .scoreValue(cpAfterPlayer)
                    .evalCpBefore(cpBefore)
                    .evalCpAfter(cpAfterPlayer)
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
