package com.chessengine.service;

import com.chessengine.dto.AiCoachRequestDTO;
import com.chessengine.dto.AiCoachResponseDTO;

public interface AiCoachService {
    AiCoachResponseDTO generateMoveCommentary(AiCoachRequestDTO request);
}
