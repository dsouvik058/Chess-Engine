package com.chessengine.multiplayer.service;

import com.chessengine.dto.*;
import com.chessengine.multiplayer.model.GameRoom;

public interface MultiplayerService {
    RoomResponseDTO createRoom(CreateRoomRequestDTO request);
    RoomResponseDTO joinRoom(JoinRoomRequestDTO request);
    GameRoom processMove(MultiplayerMoveDTO move);
    GameRoom resignMatch(String roomId, String playerId);
    GameRoom getRoom(String roomId);
}
