package com.chessengine.controller;

import com.chessengine.dto.*;
import com.chessengine.service.ChessService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chess")
@CrossOrigin(origins = "*")
public class ChessController {

    private final ChessService chessService;

    public ChessController(ChessService chessService) {
        this.chessService = chessService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getEngineStatus() {
        boolean running = chessService.isEngineRunning();
        Map<String, Object> response = new HashMap<>();
        response.put("running", running);
        response.put("engine", "Stockfish 18 (UCI)");
        response.put("maxElo", 3200);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/best-move")
    public ResponseEntity<GameStatusDTO> getBestMove(@RequestBody MoveRequestDTO request) {
        log.info("Received best-move request with FEN: {}", request.getFen());
        GameStatusDTO status = chessService.getBestMove(request);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/analyze")
    public ResponseEntity<GameAnalysisResponseDTO> analyzeGame(@RequestBody AnalyzeRequestDTO request) {
        log.info("Received game analysis request for {} moves", request.getMoves() != null ? request.getMoves().size() : 0);
        GameAnalysisResponseDTO analysis = chessService.analyzeGame(request);
        return ResponseEntity.ok(analysis);
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, String>> configureEngine(@RequestBody EngineConfigDTO config) {
        log.info("Updating engine configuration to: {}", config);
        chessService.configureEngine(config);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Engine config updated successfully");
        return ResponseEntity.ok(response);
    }
}
