package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCoachRequestDTO {
    private Integer moveIndex;
    private String fen;
    private String san;
    private String color; // "w" or "b"
    private int moveNumber;
    private String classification; // "brilliant", "great", "best", "excellent", "good", "inaccuracy", "mistake", "blunder", "book"
    private int evalCp;
    private double winPercentage;
    private double winDrop;
    private String bestMoveSan;
    private String pv;
    private String coachPersona; // "grandmaster", "enthusiastic", "tactical"
    private String customApiKey;
}
