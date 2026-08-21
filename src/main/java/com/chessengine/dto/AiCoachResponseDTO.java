package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCoachResponseDTO {
    private boolean success;
    private String commentary;
    private String tacticalSummary;
    private String suggestedLine;
    private String speechScript;
    private String provider; // "GROQ" or "HEURISTIC"
    private String model;
}
