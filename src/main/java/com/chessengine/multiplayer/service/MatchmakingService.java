package com.chessengine.multiplayer.service;

import com.chessengine.dto.MatchmakingRequestDTO;
import com.chessengine.dto.MatchmakingResponseDTO;

public interface MatchmakingService {
    MatchmakingResponseDTO joinMatchmaking(MatchmakingRequestDTO request);
    MatchmakingResponseDTO cancelMatchmaking(String playerId);
    MatchmakingResponseDTO getStatus(String playerId);
}
