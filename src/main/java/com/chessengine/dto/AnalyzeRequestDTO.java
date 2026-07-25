package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeRequestDTO {
    private String fen;
    private List<String> moves;
    private String pgn;
    private Integer elo;
    private Integer movetime;
    private Integer depth;
}
