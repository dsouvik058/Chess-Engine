package com.chessengine.dto;

import com.chessengine.multiplayer.model.GameRoom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchmakingResponseDTO {
    private String status; // "QUEUED", "MATCHED", "CANCELLED", "TIMEOUT"
    private String roomId;
    private String playerId;
    private String playerColor; // "white" or "black"
    private String opponentName;
    private Integer opponentElo;
    private Double timeControlMinutes;
    private Integer incrementSeconds;
    private GameRoom room;
}
