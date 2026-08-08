package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveAnalysisDTO {
    private int moveIndex;
    private int moveNumber;
    private String playerColor;
    private String move;
    private String piece;
    private String from;
    private String to;
    private String fenBefore;
    private String fenAfter;
    private String fen;
    private String bestMove;
    private String bestMoveSan;
    private String secondBestMove;
    private String secondBestMoveSan;
    private String ponderMove;
    private String pv;
    private String evaluation;
    private String scoreType;
    private Integer scoreValue;
    private Integer evalCpBefore;
    private Integer evalCpAfter;
    private Double winPercentageBefore;
    private Double winPercentageAfter;
    private Double winDrop;
    private String classification;
    private Integer depth;
}
