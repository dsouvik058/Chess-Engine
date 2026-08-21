package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchmakingRequestDTO {
    private String playerId;
    private String playerName;
    private Integer elo;
    private Double timeControlMinutes;
    private Integer incrementSeconds;
    private String category;
    private String preferredColor; // "white", "black", "random"
}
