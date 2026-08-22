package com.chessengine.service;

import com.chessengine.dto.AiCoachRequestDTO;
import com.chessengine.dto.AiCoachResponseDTO;

import java.util.List;

public interface AiCoachService {
    AiCoachResponseDTO generateMoveCommentary(AiCoachRequestDTO request);
    List<AiCoachResponseDTO> generateBatchCommentary(List<AiCoachRequestDTO> requests);
}
