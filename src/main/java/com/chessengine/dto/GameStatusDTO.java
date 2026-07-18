package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStatusDTO {
    private String bestMove;
    private String ponderMove;
    private String evaluation; // Human readable (e.g. "+1.25" or "#M3")
    private String scoreType;  // "cp" or "mate"
    private Integer scoreValue; // numeric value
    private Integer depth;
    private Long nodes;
    private Long nps;
    private Long timeMs;
}
