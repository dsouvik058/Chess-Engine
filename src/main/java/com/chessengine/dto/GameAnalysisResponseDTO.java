package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameAnalysisResponseDTO {
    private List<MoveAnalysisDTO> evaluations;
    private int totalMoves;
    private double whiteAccuracy;
    private double blackAccuracy;
    
    private int whiteBookCount;
    private int whiteBrilliantCount;
    private int whiteGreatCount;
    private int whiteBestCount;
    private int whiteExcellentCount;
    private int whiteGoodCount;
    private int whiteInaccuracyCount;
    private int whiteMistakeCount;
    private int whiteBlunderCount;
    private int whiteMissCount;

    private int blackBookCount;
    private int blackBrilliantCount;
    private int blackGreatCount;
    private int blackBestCount;
    private int blackExcellentCount;
    private int blackGoodCount;
    private int blackInaccuracyCount;
    private int blackMistakeCount;
    private int blackBlunderCount;
    private int blackMissCount;
}
