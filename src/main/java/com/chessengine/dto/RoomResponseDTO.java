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
public class RoomResponseDTO {
    private GameRoom room;
    private String playerId;
    private String playerColor; // "white" or "black"
    private String role; // "HOST" or "GUEST"
}
