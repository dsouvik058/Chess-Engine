package com.chessengine.service.impl;

import com.chessengine.dto.*;
import com.chessengine.engine.process.StockfishProcessManager;
import com.chessengine.service.ChessService;
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
                    .build();
        }

        List<MoveAnalysisDTO> evaluations = new ArrayList<>();
        int elo = request.getElo() != null ? request.getElo() : 3200;
        int movetime = request.getMovetime() != null ? request.getMovetime() : 200;

        List<String> currentMoves = new ArrayList<>();
        for (int i = 0; i < moves.size(); i++) {
            currentMoves.add(moves.get(i));
            GameStatusDTO status = engineManager.calculateBestMove(
                    request.getFen(),
                    new ArrayList<>(currentMoves),
                    movetime,
                    request.getDepth(),
                    elo
            );

            evaluations.add(MoveAnalysisDTO.builder()
                    .moveIndex(i + 1)
                    .move(moves.get(i))
                    .bestMove(status.getBestMove())
                    .ponderMove(status.getPonderMove())
                    .evaluation(status.getEvaluation())
                    .scoreType(status.getScoreType())
                    .scoreValue(status.getScoreValue())
                    .depth(status.getDepth())
                    .build());
        }

        return GameAnalysisResponseDTO.builder()
                .evaluations(evaluations)
                .totalMoves(evaluations.size())
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
