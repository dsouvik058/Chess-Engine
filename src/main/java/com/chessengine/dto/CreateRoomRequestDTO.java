package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequestDTO {
    private String preferredColor; // "white", "black", "random"
    private Integer timeControlMinutes; // 5, 10, 15, etc.
}
