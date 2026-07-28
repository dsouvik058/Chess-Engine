package com.chessengine.multiplayer.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameRoom {
    private String roomId;
    private String hostPlayerId;
    private String guestPlayerId;

    private String whitePlayerId;
    private String blackPlayerId;

    private String whitePlayerName;
    private String blackPlayerName;

    private String currentFen;
    
    @Builder.Default
    private List<String> moveHistory = new ArrayList<>();

    private double timeControlMinutes;
    private long whiteTimeMs;
    private long blackTimeMs;

    private String status; // "WAITING", "IN_PROGRESS", "FINISHED"
    private String winnerColor; // "w", "b", "draw"
    private String finishReason;
}
