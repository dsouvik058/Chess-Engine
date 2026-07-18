package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EngineConfigDTO {
    private Integer elo;
    private Integer threads;
    private Integer hashSizeMb;
    private Boolean limitStrength;
}
