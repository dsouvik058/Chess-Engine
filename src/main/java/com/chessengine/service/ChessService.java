package com.chessengine.service;

import com.chessengine.dto.AnalyzeRequestDTO;
import com.chessengine.dto.EngineConfigDTO;
import com.chessengine.dto.GameAnalysisResponseDTO;
import com.chessengine.dto.GameStatusDTO;
import com.chessengine.dto.MoveRequestDTO;

public interface ChessService {
    GameStatusDTO getBestMove(MoveRequestDTO request);
    GameAnalysisResponseDTO analyzeGame(AnalyzeRequestDTO request);
    void configureEngine(EngineConfigDTO config);
    boolean isEngineRunning();
}
