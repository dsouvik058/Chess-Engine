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
    private String move;
    private String fen;
    private String bestMove;
    private String ponderMove;
    private String evaluation;
    private String scoreType;
    private Integer scoreValue;
    private Integer depth;
}
