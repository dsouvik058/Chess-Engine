package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultiplayerMoveDTO {
    private String roomId;
    private String playerId;
    private String from;
    private String to;
    private String san;
    private String fen;
    private String promotion;
    private Long whiteTimeMs;
    private Long blackTimeMs;
    private Boolean isCheckmate;
    private Boolean isDraw;
}
