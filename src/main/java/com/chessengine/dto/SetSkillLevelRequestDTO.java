package com.chessengine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetSkillLevelRequestDTO {
    private int eloRating;
    private String skillLevel;
}
