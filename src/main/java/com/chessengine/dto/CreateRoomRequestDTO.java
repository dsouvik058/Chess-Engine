package com.chessengine.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateRoomRequestDTO {
    private String playerName;
    private String preferredColor; // "white", "black", "random"
    private Double timeControlMinutes; // 1.5, 3, 5, 10, 15, 30 etc.
}
