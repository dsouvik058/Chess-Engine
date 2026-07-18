package com.chessengine.service.impl;

import com.chessengine.dto.EngineConfigDTO;
import com.chessengine.dto.GameStatusDTO;
import com.chessengine.dto.MoveRequestDTO;
import com.chessengine.engine.StockfishProcessManager;
import com.chessengine.service.ChessService;
import org.springframework.stereotype.Service;

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
